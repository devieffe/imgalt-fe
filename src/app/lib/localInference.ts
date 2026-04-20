// This file must only ever run in the browser.
import { pipeline, env } from '@huggingface/transformers';
import type { ImageToTextPipeline } from '@huggingface/transformers';

// blip-image-captioning-base now returns 401 on HuggingFace (gated).
// vit-gpt2-image-captioning is publicly accessible.
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;

export type ProgressCallback = (p: { status: string; progress?: number }) => void;

const MODEL_ID = 'Xenova/vit-gpt2-image-captioning';

export async function isModelCached(): Promise<boolean> {
    if (typeof caches === 'undefined') return false;
    try {
        const cacheName = (env.cacheKey as string) || 'transformers-cache';
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        return keys.some(req => req.url.includes(MODEL_ID));
    } catch {
        return false;
    }
}

export async function loadImageCaptionPipeline(
    onProgress: ProgressCallback
): Promise<ImageToTextPipeline> {
    return pipeline('image-to-text', MODEL_ID, {
        dtype: 'fp32',
        progress_callback: onProgress,
    }) as Promise<ImageToTextPipeline>;
}
