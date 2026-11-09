// This file must only ever run in the browser.
import { pipeline, env } from '@huggingface/transformers';
import type { ImageToTextPipeline, Text2TextGenerationPipeline, ProgressInfo } from '@huggingface/transformers';
import { LOCAL_MODELS } from './modelInfo';

env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;

export type ProgressCallback = (progress: ProgressInfo) => void;

const IMAGE_MODEL = LOCAL_MODELS.caption.id;
const REPHRASE_MODEL = LOCAL_MODELS.rephrase.id;
const MODEL_IDS = [IMAGE_MODEL, REPHRASE_MODEL];
// Approximate quantized model sizes, used to combine both download progress reports.
const MODEL_BYTES: number[] = [LOCAL_MODELS.caption.estimatedBytes, LOCAL_MODELS.rephrase.estimatedBytes];

export async function getModelCacheUrls(): Promise<string[]> {
    if (typeof caches === 'undefined') return [];
    try {
        const cache = await caches.open((env.cacheKey as string) || 'transformers-cache');
        return (await cache.keys()).map(request => request.url)
            .filter(url => MODEL_IDS.some(id => url.includes(id)));
    } catch {
        return [];
    }
}

function isCached(urls: string[], model: string): boolean {
    const modelUrls = urls.filter(url => url.includes(model));
    const hasFile = (file: string) => modelUrls.some(url => new URL(url).pathname.endsWith(`/${file}`));
    return hasFile('config.json') && hasFile('tokenizer.json')
        && (model !== IMAGE_MODEL || hasFile('preprocessor_config.json'))
        && hasFile('onnx/encoder_model_quantized.onnx')
        && hasFile('onnx/decoder_model_merged_quantized.onnx');
}

export async function hasModelCache(): Promise<boolean> {
    return (await getModelCacheUrls()).length > 0;
}

export async function isModelCached(): Promise<boolean> {
    const urls = await getModelCacheUrls();
    return MODEL_IDS.every(model => isCached(urls, model));
}

export async function deleteCachedModel(preserve: string[] = []): Promise<number> {
    if (typeof caches === 'undefined') return 0;
    const cache = await caches.open((env.cacheKey as string) || 'transformers-cache');
    const requests = await cache.keys();
    const modelRequests = requests.filter(request => MODEL_IDS.some(id => request.url.includes(id)) && !preserve.includes(request.url));
    const deleted = await Promise.all(modelRequests.map(request => cache.delete(request)));
    return deleted.filter(Boolean).length;
}

export async function loadLocalPipelines(onProgress: ProgressCallback): Promise<{
    captioner: ImageToTextPipeline;
    rephraser: Text2TextGenerationPipeline;
}> {
    const cachedUrls = await getModelCacheUrls();
    const loaded = MODEL_IDS.map((id, i) => isCached(cachedUrls, id) ? MODEL_BYTES[i] : 0);
    const total = MODEL_BYTES.reduce((sum, size) => sum + size, 0);
    const progressFor = (index: number) => (progress: ProgressInfo) => {
        if (progress.status !== 'progress_total') return;
        loaded[index] = Math.max(loaded[index], Math.min(MODEL_BYTES[index], progress.loaded));
        const bytes = Math.round(loaded.reduce((sum, size) => sum + size, 0));
        onProgress({ ...progress, loaded: bytes, total, progress: bytes / total * 100 });
    };
    const options = { dtype: 'q8' as const, session_options: { graphOptimizationLevel: 'basic' as const } };
    const captioner = await pipeline('image-to-text', IMAGE_MODEL, { ...options, progress_callback: progressFor(0) });
    loaded[0] = MODEL_BYTES[0];
    try {
        const rephraser = await pipeline('text2text-generation', REPHRASE_MODEL, { ...options, progress_callback: progressFor(1) });
        return { captioner, rephraser };
    } catch (error) {
        await captioner.dispose();
        throw error;
    }
}
