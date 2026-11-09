import type { ImageToTextPipeline, ProgressInfo, Text2TextGenerationPipeline } from '@huggingface/transformers';

export type LocalImagePipeline = {
    (src: string): Promise<Array<{ generated_text: string }>>;
    dispose(): Promise<void>;
};

type WorkerReply = {
    type: 'loaded' | 'result' | 'error' | 'progress';
    id?: number;
    result?: Array<{ generated_text: string }>;
    error?: string;
    progress?: ProgressInfo;
};

type LocalPipelines = {
    captioner: ImageToTextPipeline;
    rephraser: Text2TextGenerationPipeline;
};

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

function createMainThreadPipeline(models: LocalPipelines, onDispose: () => void): LocalImagePipeline {
    const pipe = (async (src: string) => {
        const result = await models.captioner(src, { num_beams: 4, max_new_tokens: 48 });
        const caption = result[0]?.generated_text?.trim() ?? '';
        if (!caption) throw new Error('No image description was generated.');
        const output = await models.rephraser(`Rewrite this image description clearly without adding details: ${caption}`, { max_new_tokens: 64, num_beams: 4 });
        const rewritten = output[0]?.generated_text?.trim() ?? '';
        return [{ generated_text: safeRewrite(caption, rewritten) }];
    }) as LocalImagePipeline;
    pipe.dispose = async () => {
        onDispose();
        await Promise.all([models.captioner.dispose(), models.rephraser.dispose()]);
    };
    return pipe;
}

function loadMainThreadModel(onProgress: (progress: ProgressInfo) => void, signal: AbortSignal): Promise<LocalImagePipeline> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Model loading cancelled.', 'AbortError'));
            return;
        }
        let settled = false;
        const abort = () => {
            settled = true;
            signal.removeEventListener('abort', abort);
            reject(new DOMException('Model loading cancelled.', 'AbortError'));
        };
        signal.addEventListener('abort', abort, { once: true });
        void import('./localInference')
            .then(({ loadLocalPipelines }) => loadLocalPipelines(onProgress))
            .then(models => {
                if (settled || signal.aborted) {
                    void Promise.all([models.captioner.dispose(), models.rephraser.dispose()]);
                    return;
                }
                settled = true;
                signal.removeEventListener('abort', abort);
                resolve(createMainThreadPipeline(models, () => signal.removeEventListener('abort', abort)));
            })
            .catch(error => {
                if (settled) return;
                settled = true;
                signal.removeEventListener('abort', abort);
                reject(error);
            });
    });
}

export function loadLocalModel(onProgress: (progress: ProgressInfo) => void, signal: AbortSignal): Promise<LocalImagePipeline> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Model loading cancelled.', 'AbortError'));
            return;
        }
        let worker: Worker;
        try {
            worker = new Worker(new URL('../workers/localModel.worker.ts', import.meta.url));
        } catch {
            void loadMainThreadModel(onProgress, signal).then(resolve, reject);
            return;
        }
        const requests = new Map<number, { resolve: (value: Array<{ generated_text: string }>) => void; reject: (error: Error) => void }>();
        let nextId = 0;
        let initialized = false;
        let disposed = false;
        let fallbackStarted = false;
        const close = (error: Error) => {
            if (disposed) return;
            disposed = true;
            worker.terminate();
            signal.removeEventListener('abort', abort);
            if (!initialized) reject(error);
            for (const request of requests.values()) request.reject(error);
            requests.clear();
        };
        const fallbackToMainThread = async () => {
            if (disposed || initialized || fallbackStarted) return;
            fallbackStarted = true;
            worker.terminate();
            try {
                const pipe = await loadMainThreadModel(onProgress, signal);
                if (disposed || signal.aborted) {
                    await pipe.dispose();
                    return;
                }
                initialized = true;
                const fallbackPipe = pipe;
                const disposeFallback = pipe.dispose.bind(pipe);
                fallbackPipe.dispose = async () => {
                    disposed = true;
                    signal.removeEventListener('abort', abort);
                    for (const request of requests.values()) request.reject(new Error('Local model was closed.'));
                    requests.clear();
                    await disposeFallback();
                };
                resolve(fallbackPipe);
            } catch (error) {
                if (!disposed) close(error instanceof Error ? error : new Error(String(error)));
            }
        };
        const abort = () => close(new DOMException('Model loading cancelled.', 'AbortError'));
        signal.addEventListener('abort', abort, { once: true });
        worker.onerror = () => { void fallbackToMainThread(); };
        worker.onmessage = (event: MessageEvent<WorkerReply>) => {
            if (disposed) return;
            const message = event.data;
            if (message.type === 'progress' && message.progress) {
                onProgress(message.progress);
            } else if (message.type === 'loaded') {
                initialized = true;
                const pipe = ((src: string) => new Promise<Array<{ generated_text: string }>>((resolveRequest, rejectRequest) => {
                    if (disposed) return rejectRequest(new Error('Local model was closed.'));
                    const id = ++nextId;
                    requests.set(id, { resolve: resolveRequest, reject: rejectRequest });
                    worker.postMessage({ type: 'caption', id, src });
                })) as LocalImagePipeline;
                pipe.dispose = async () => close(new DOMException('Local model closed.', 'AbortError'));
                resolve(pipe);
            } else if (message.type === 'error' && !initialized) {
                close(new Error(message.error || 'Local model failed to load.'));
            } else if (message.id !== undefined) {
                const request = requests.get(message.id);
                if (!request) return;
                requests.delete(message.id);
                if (message.type === 'error') request.reject(new Error(message.error || 'Local model failed.'));
                else if (message.type === 'result') request.resolve(message.result ?? []);
            }
        };
        worker.postMessage({ type: 'load', id: 0 });
    });
}
