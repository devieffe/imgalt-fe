import type { ProgressInfo } from '@huggingface/transformers';

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

export function loadLocalModel(onProgress: (progress: ProgressInfo) => void, signal: AbortSignal): Promise<LocalImagePipeline> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Model loading cancelled.', 'AbortError'));
            return;
        }
        const worker = new Worker(new URL('../workers/localModel.worker.ts', import.meta.url));
        const requests = new Map<number, { resolve: (value: Array<{ generated_text: string }>) => void; reject: (error: Error) => void }>();
        let nextId = 0;
        let initialized = false;
        let disposed = false;
        const close = (error: Error) => {
            if (disposed) return;
            disposed = true;
            worker.terminate();
            signal.removeEventListener('abort', abort);
            if (!initialized) reject(error);
            for (const request of requests.values()) request.reject(error);
            requests.clear();
        };
        const abort = () => close(new DOMException('Model loading cancelled.', 'AbortError'));
        signal.addEventListener('abort', abort, { once: true });
        worker.onerror = event => close(new Error(event.message || 'Local model worker failed.'));
        worker.onmessage = (event: MessageEvent<WorkerReply>) => {
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
