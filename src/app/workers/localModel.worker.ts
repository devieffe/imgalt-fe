import { loadLocalPipelines } from '../lib/localInference';
import type { ImageToTextPipeline, Text2TextGenerationPipeline } from '@huggingface/transformers';

let captioner: ImageToTextPipeline | null = null;
let rephraser: Text2TextGenerationPipeline | null = null;
let queue = Promise.resolve();

// Keep the original caption when the rewrite adds unsupported content or drops key words.
function safeRewrite(original: string, rewritten: string): string {
    const clean = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const common = new Set(['a', 'an', 'the']);
    const words = (text: string) => clean(text).filter(word => !common.has(word));
    const sourceWords = words(original);
    const resultWords = words(rewritten);
    if (!sourceWords.length || !resultWords.length) return original;
    if (sourceWords.length !== resultWords.length || sourceWords.some((word, index) => word !== resultWords[index])) return original;
    return rewritten;
}

self.addEventListener('message', (event: MessageEvent<{ type: 'load' | 'caption'; id: number; src?: string }>) => {
    const { type, id, src } = event.data;
    if (type === 'load') {
        void loadLocalPipelines(progress => self.postMessage({ type: 'progress', progress }))
            .then(models => {
                captioner = models.captioner;
                rephraser = models.rephraser;
                self.postMessage({ type: 'loaded', id });
            })
            .catch(error => self.postMessage({ type: 'error', id, error: String(error instanceof Error ? error.message : error) }));
        return;
    }

    queue = queue.then(async () => {
        try {
            if (!captioner || !rephraser || !src) throw new Error('Local models are not ready.');
            const result = await captioner(src, { num_beams: 4, max_new_tokens: 48 });
            const caption = result[0]?.generated_text?.trim() ?? '';
            if (!caption) throw new Error('No image description was generated.');
            const output = await rephraser(`Rewrite this image description clearly without adding details: ${caption}`, { max_new_tokens: 64, num_beams: 4 });
            const rewritten = output[0]?.generated_text?.trim() ?? '';
            self.postMessage({ type: 'result', id, result: [{ generated_text: safeRewrite(caption, rewritten) }] });
        } catch (error) {
            self.postMessage({ type: 'error', id, error: String(error instanceof Error ? error.message : error) });
        }
    });
});
