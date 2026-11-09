'use client';

import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { LocalImagePipeline } from '../lib/localModelClient';
import { applyStyleRules, type OutputStyle } from '../lib/styleRules';

export type { OutputStyle };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MIN_GENERATION_DISPLAY_MS = 1_920; // 420ms fade/collapse plus 1.5s with the wheel visible.
const LOCAL_INFERENCE_TIMEOUT_MS = 60_000;

export type Method = 'api' | 'local';

export function useAltText() {
    const [imageSrc, setImageSrc] = useState('');
    const [imageVersion, setImageVersion] = useState(0);
    const [imageUploadVersion, setImageUploadVersion] = useState(0);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [altText, setAltText] = useState('');
    const [error, setErrorState] = useState('');
    const [urlError, setUrlErrorState] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageValidated, setImageValidated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [method, setMethod] = useState<Method>('api');
    const [outputStyle, setOutputStyle] = useState<OutputStyle>('normal');
    const [localStatus, setLocalStatus] = useState('');
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [downloadedBytes, setDownloadedBytes] = useState<number | null>(null);
    const [downloadTotalBytes, setDownloadTotalBytes] = useState<number | null>(null);
    const [modelReady, setModelReady] = useState(false);
    const [modelCached, setModelCached] = useState(false);
    const [modelCachePresent, setModelCachePresent] = useState(false);
    const [modelWorking, setModelWorking] = useState<boolean | null>(null);
    const [apiWorking, setApiWorking] = useState<boolean | null>(null);
    const [deletingModel, setDeletingModel] = useState(false);
    const pipelineRef = useRef<LocalImagePipeline | null>(null);
    const pipelinePromiseRef = useRef<Promise<LocalImagePipeline> | null>(null);
    const localCleanupRef = useRef<Promise<void> | null>(null);
    const localDownloadAbortRef = useRef<AbortController | null>(null);
    const downloadInProgressRef = useRef(false);
    const cacheBeforeDownloadRef = useRef<string[]>([]);
    const localLoadIdRef = useRef(0);
    const generationIdRef = useRef(0);
    const methodRef = useRef<Method>('api');
    const localConfirmationPendingRef = useRef(false);
    const outputStyleRef = useRef<OutputStyle>('normal');
    const localCaptionRef = useRef<{ src: string; raw: string } | null>(null);
    const imageSrcRef = useRef('');
    const imageLoadReadyRef = useRef(false);
    const imageInputRequestIdRef = useRef(0);
    const currentImageRequestIdRef = useRef(0);
    const imageUrlAbortRef = useRef<AbortController | null>(null);
    const errorRef = useRef('');
    const urlErrorRef = useRef('');

    const setError = (message: string) => {
        errorRef.current = message;
        setErrorState(message);
    };
    const setUrlError = (message: string) => {
        urlErrorRef.current = message;
        setUrlErrorState(message);
    };

    const setCurrentImage = (src: string) => {
        imageSrcRef.current = src;
        currentImageRequestIdRef.current = imageInputRequestIdRef.current;
        imageLoadReadyRef.current = false;
        setImageValidated(false);
        setImageVersion(version => version + 1);
        setImageSrc(src);
    };

    const beginImageInputRequest = () => {
        imageUrlAbortRef.current?.abort();
        imageUrlAbortRef.current = null;
        imageLoadReadyRef.current = false;
        setImageValidated(false);
        return ++imageInputRequestIdRef.current;
    };

    useEffect(() => {
        import('../lib/localInference')
            .then(async m => {
                const [cached, cachePresent] = await Promise.all([m.isModelCached(), m.hasModelCache()]);
                setModelCached(cached);
                setModelCachePresent(cachePresent);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/imgalt', { signal: controller.signal, cache: 'no-store' })
            .then(response => response.ok ? response.json() : null)
            .then(data => { if (data?.configured === false) setApiWorking(current => current ?? false); })
            .catch(() => {});
        return () => controller.abort();
    }, []);

    const getLocalPipeline = async (): Promise<LocalImagePipeline> => {
        if (localCleanupRef.current) await localCleanupRef.current;
        if (methodRef.current !== 'local') throw new DOMException('Local model loading cancelled.', 'AbortError');
        if (pipelineRef.current) return pipelineRef.current;
        if (pipelinePromiseRef.current) return pipelinePromiseRef.current;

        const loadId = ++localLoadIdRef.current;
        const controller = new AbortController();
        localDownloadAbortRef.current = controller;
        setModelWorking(null);
        setLocalStatus('Loading model into memory…');
        const pipelinePromise = (async () => {
            try {
                const [{ isModelCached: checkCache, getModelCacheUrls }, { loadLocalModel }] = await Promise.all([
                    import('../lib/localInference'), import('../lib/localModelClient'),
                ]);
                const [cached, cachedUrls] = await Promise.all([checkCache(), getModelCacheUrls()]);
                if (controller.signal.aborted) throw new DOMException('Model loading cancelled.', 'AbortError');
                setModelCached(cached);
                cacheBeforeDownloadRef.current = cachedUrls;
                downloadInProgressRef.current = !cached;
                if (!cached) {
                    setDownloadProgress(0);
                    setDownloadedBytes(0);
                    setDownloadTotalBytes(null);
                    setLocalStatus('downloading');
                } else {
                    setDownloadProgress(null);
                    setDownloadedBytes(null);
                    setDownloadTotalBytes(null);
                    setLocalStatus('Loading model into memory…');
                }
                const pipe = await loadLocalModel((p) => {
                    if (!cached) {
                        if (p.status === 'progress_total') {
                            setDownloadProgress(Math.max(0, Math.min(100, p.progress)));
                            setDownloadedBytes(p.loaded);
                            setDownloadTotalBytes(p.total);
                            setLocalStatus('downloading');
                        } else if (p.status === 'ready') {
                            setDownloadProgress(null);
                            setDownloadedBytes(null);
                            setDownloadTotalBytes(null);
                            setLocalStatus('Loading model into memory…');
                        }
                    }
                }, controller.signal);
                if (controller.signal.aborted) {
                    await pipe.dispose();
                    throw new DOMException('Model loading cancelled.', 'AbortError');
                }
                pipelineRef.current = pipe;
                setModelReady(true);
                setModelWorking(null);
                setModelCached(true);
                setModelCachePresent(true);
                setDownloadProgress(null);
                setDownloadedBytes(null);
                setDownloadTotalBytes(null);
                downloadInProgressRef.current = false;
                setLocalStatus('Local image model ready.');
                return pipe;
            } catch (err) {
                if (!controller.signal.aborted) console.error('Pipeline load error:', err);
                setDownloadProgress(null);
                setDownloadedBytes(null);
                setDownloadTotalBytes(null);
                downloadInProgressRef.current = false;
                if (loadId === localLoadIdRef.current && !controller.signal.aborted) {
                    setLocalStatus('');
                    setModelReady(false);
                    setModelCached(false);
                    setModelWorking(false);
                    const { hasModelCache, isModelCached } = await import('../lib/localInference');
                    const [present, cached] = await Promise.all([hasModelCache(), isModelCached()]);
                    if (loadId === localLoadIdRef.current) {
                        setModelCachePresent(present);
                        setModelCached(cached);
                    }
                }
                throw err;
            } finally {
                if (localDownloadAbortRef.current === controller) localDownloadAbortRef.current = null;
            }
        })();

        pipelinePromiseRef.current = pipelinePromise;
        try {
            return await pipelinePromise;
        } finally {
            if (pipelinePromiseRef.current === pipelinePromise) pipelinePromiseRef.current = null;
        }
    };

    const generateAltText = async (
        src: string,
        selectedMethod: Method = methodRef.current,
        selectedStyle: OutputStyle = outputStyleRef.current,
        minimumLoadingMs = MIN_GENERATION_DISPLAY_MS,
    ) => {
        if (!src) return;
        const startedAt = Date.now();
        const generationId = ++generationIdRef.current;
        setAltText('');
        setError('');
        setCopied(false);
        setLoading(true);

        const isCurrent = () => generationId === generationIdRef.current
            && src === imageSrcRef.current
            && selectedMethod === methodRef.current
            && !errorRef.current && !urlErrorRef.current;

        let requestTimeout: number | undefined;
        let inferenceTimeout: number | undefined;
        try {
            let generatedText = '';
            if (selectedMethod === 'local') {
                if (typeof window === 'undefined') {
                    setError('Local model can only run in the browser.');
                    return;
                }
                let raw = localCaptionRef.current?.src === src ? localCaptionRef.current.raw : '';
                if (!raw) {
                    const pipe = await getLocalPipeline();
                    if (!isCurrent()) return;
                    setLoading(true);
                    const inference = pipe(src);
                    const result = await Promise.race([
                        inference,
                        new Promise<never>((_, reject) => {
                            inferenceTimeout = window.setTimeout(
                                () => reject(new DOMException('Local model inference timed out.', 'TimeoutError')),
                                LOCAL_INFERENCE_TIMEOUT_MS,
                            );
                        }),
                    ]).catch(async err => {
                        if (err instanceof DOMException && err.name === 'TimeoutError') {
                            await pipe.dispose().catch(() => undefined);
                            if (pipelineRef.current === pipe) {
                                pipelineRef.current = null;
                                setModelReady(false);
                                setModelWorking(false);
                            }
                        }
                        throw err;
                    }).finally(() => {
                        if (inferenceTimeout !== undefined) window.clearTimeout(inferenceTimeout);
                    });
                    if (generationId !== generationIdRef.current) return;
                    const caption = Array.isArray(result) ? result[0] as { generated_text?: unknown } | undefined : undefined;
                    raw = typeof caption?.generated_text === 'string' ? caption.generated_text.trim() : '';
                    if (raw) localCaptionRef.current = { src, raw };
                }
                generatedText = applyStyleRules(raw, selectedStyle);
            } else {
                const availability = await fetch('/api/imgalt', { cache: 'no-store' });
                const status: unknown = await availability.json().catch(() => null);
                if (!isCurrent()) return;
                if (!availability.ok || !status || typeof status !== 'object' || !('configured' in status) || typeof status.configured !== 'boolean') {
                    setApiWorking(false);
                    setError('Unable to check alt-text generation availability. Please try again.');
                    return;
                }
                if (!status.configured) {
                    setApiWorking(false);
                    setError('Alt-text generation is not configured.');
                    return;
                }
                setLoading(true);
                const controller = new AbortController();
                requestTimeout = window.setTimeout(() => controller.abort(), 60_000);
                const res = await fetch('/api/imgalt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: src, outputStyle: selectedStyle }),
                    signal: controller.signal,
                });
                window.clearTimeout(requestTimeout);
                requestTimeout = undefined;
                if (generationId !== generationIdRef.current) return;
                const data: unknown = await res.json().catch(() => null);
                if (generationId !== generationIdRef.current) return;
                const result = data && typeof data === 'object' ? data as { alt?: unknown; error?: unknown } : {};
                if (!res.ok || typeof result.error === 'string') {
                    if (res.status >= 500 || res.status === 401 || res.status === 403 || res.status === 429) setApiWorking(false);
                    setError(typeof result.error === 'string' ? result.error : 'Failed to generate alt text.');
                    return;
                }
                generatedText = typeof result.alt === 'string' ? result.alt.trim() : '';
                if (generatedText) setApiWorking(true);
            }
            if (generationId !== generationIdRef.current || src !== imageSrcRef.current || errorRef.current || urlErrorRef.current) return;
            generatedText = generatedText.replace(/\.+\s*$/, '').trim();
            if (!generatedText) {
                setError('No alt text generated.');
                return;
            }
            const remainingLoadingMs = minimumLoadingMs - (Date.now() - startedAt);
            if (remainingLoadingMs > 0) await new Promise(resolve => window.setTimeout(resolve, remainingLoadingMs));
            if (generationId !== generationIdRef.current) return;
            if (selectedMethod === 'local') setModelWorking(true);
            setAltText(generatedText);
        } catch (err) {
            if (requestTimeout !== undefined) window.clearTimeout(requestTimeout);
            if (inferenceTimeout !== undefined) window.clearTimeout(inferenceTimeout);
            if (!isCurrent()) return;
            setLocalStatus('');
            if (selectedMethod === 'local') setModelWorking(false);
            else setApiWorking(false);
            const msg = err instanceof Error ? err.message : String(err);
            setError(err instanceof DOMException && err.name === 'AbortError'
                ? 'The request took too long. Please try again.'
                : selectedMethod === 'local'
                    ? `Local model error: ${msg}`
                    : 'Image processing failed. Please try again.');
        } finally {
            if (generationId === generationIdRef.current) setLoading(false);
        }
    };

    const removeImage = () => {
        beginImageInputRequest();
        generationIdRef.current++;
        localCaptionRef.current = null;
        setCurrentImage('');
        setImageUrlInput('');
        setAltText('');
        setError('');
        setUrlError('');
        setLoading(false);
        setCopied(false);
    };

    const handleUpload = (file: File | null) => {
        if (!file) return;
        setImageUploadVersion(version => version + 1);
        const uploadId = beginImageInputRequest();
        generationIdRef.current++;
        setLoading(false);
        setError('');
        setUrlError('');
        setAltText('');
        setCopied(false);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only JPEG, PNG, and WebP images are supported.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('Choose an image smaller than 6 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (uploadId !== imageInputRequestIdRef.current) return;
            if (typeof reader.result !== 'string') {
                setError('The selected image could not be read.');
                return;
            }
            setCurrentImage(reader.result);
        };
        reader.onerror = () => {
            if (uploadId === imageInputRequestIdRef.current) setError('The selected image could not be read.');
        };
        reader.readAsDataURL(file);
    };

    const handleUrlSubmit = async () => {
        const trimmed = imageUrlInput.trim();
        if (!trimmed) return;
        setImageUploadVersion(version => version + 1);

        const requestId = beginImageInputRequest();
        generationIdRef.current++;
        setLoading(false);
        setError('');
        setUrlError('');
        setAltText('');
        setCopied(false);

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(trimmed);
        } catch {
            setUrlError('Enter a valid image URL.');
            return;
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            setUrlError('Only http and https image URLs are allowed.');
            return;
        }

        if (!ALLOWED_EXTENSIONS.test(parsedUrl.pathname)) {
            setUrlError('Only image URLs ending in .jpg, .jpeg, .png, or .webp are allowed.');
            return;
        }

        let objectUrl = '';
        let requestController: AbortController | null = null;
        try {
            requestController = new AbortController();
            imageUrlAbortRef.current = requestController;
            const requestTimeout = window.setTimeout(() => requestController?.abort(), 20_000);
            let imageBlob: Blob;
            try {
                const response = await fetch('/api/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: parsedUrl.href }),
                    signal: requestController.signal,
                });

                if (!response.ok) {
                    const result: unknown = await response.json().catch(() => null);
                    const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
                        ? result.error
                        : 'The image URL could not be loaded.';
                    throw new Error(message);
                }

                imageBlob = await response.blob();
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') throw new Error('timeout');
                throw error;
            } finally {
                window.clearTimeout(requestTimeout);
            }

            objectUrl = URL.createObjectURL(imageBlob);
            const imageDataUrl = await new Promise<string>((resolve, reject) => {
                const img = new window.Image();
                const timeout = window.setTimeout(() => reject(new Error('timeout')), 15_000);
                img.onload = () => {
                    window.clearTimeout(timeout);
                    if (img.naturalWidth * img.naturalHeight > MAX_IMAGE_PIXELS) {
                        reject(new Error('dimensions'));
                        return;
                    }
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const context = canvas.getContext('2d');
                        if (!context) throw new Error('canvas');
                        context.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/jpeg', 0.9));
                    } catch {
                        reject(new Error('image'));
                    }
                };
                img.onerror = () => {
                    window.clearTimeout(timeout);
                    reject(new Error('image'));
                };
                img.src = objectUrl;
            });
            if (requestId !== imageInputRequestIdRef.current) return;
            setCurrentImage(imageDataUrl);
        } catch (error) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (requestId !== imageInputRequestIdRef.current) return;
            setUrlError(error instanceof Error && error.message === 'dimensions'
                ? 'This image is too large to process.'
                : error instanceof Error && error.message === 'timeout'
                    ? 'The image took too long to load.'
                    : error instanceof Error ? error.message : 'The image URL could not be loaded.');
        } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (imageUrlAbortRef.current === requestController) imageUrlAbortRef.current = null;
        }
    };

    const handleCopy = async () => {
        if (!altText) return;
        try {
            await navigator.clipboard.writeText(altText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Failed to copy to clipboard.');
        }
    };

    const handlePreviewLoaded = async (src: string) => {
        const requestId = currentImageRequestIdRef.current;
        if (!src || src !== imageSrcRef.current || requestId !== imageInputRequestIdRef.current || errorRef.current || urlErrorRef.current) return;

        let width = 0;
        let height = 0;
        try {
            const image = new window.Image();
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error('image'));
                image.src = src;
            });
            width = image.naturalWidth;
            height = image.naturalHeight;
        } catch {
            if (requestId === imageInputRequestIdRef.current && src === imageSrcRef.current && !errorRef.current && !urlErrorRef.current) {
                setError('The selected image could not be processed.');
            }
            return;
        }

        if (requestId !== imageInputRequestIdRef.current || src !== imageSrcRef.current || errorRef.current || urlErrorRef.current) return;
        if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
            setError('This image is too large to process.');
            return;
        }

        imageLoadReadyRef.current = true;
        setImageValidated(true);
        if (!localConfirmationPendingRef.current) void generateAltText(src, methodRef.current);
    };

    const prepareLocalModel = () => {
        localConfirmationPendingRef.current = true;
        generationIdRef.current++;
        setLoading(false);
        setAltText('');
        setError('');
        setUrlError('');
    };

    const changeMethod = (m: Method) => {
        localConfirmationPendingRef.current = false;
        generationIdRef.current++;
        methodRef.current = m;
        setMethod(m);
        if (m === 'api') localCaptionRef.current = null;
        setLoading(false);
        setAltText('');
        setError('');
        setUrlError('');
        if (m === 'api' && !pipelinePromiseRef.current) setLocalStatus('');
        const changeId = generationIdRef.current;
        window.requestAnimationFrame(() => window.setTimeout(() => {
            if (changeId !== generationIdRef.current || methodRef.current !== m) return;
            if (imageSrcRef.current && imageLoadReadyRef.current) {
                void generateAltText(imageSrcRef.current, m);
            } else if (!imageSrcRef.current && m === 'local' && !pipelineRef.current) {
                const load = getLocalPipeline();
                void load.catch((err) => {
                    if (changeId !== generationIdRef.current || methodRef.current !== m) return;
                    setLocalStatus('');
                    const reason = err instanceof Error && err.message ? `: ${err.message}` : '';
                    setError(`The local image model could not be loaded${reason}.`);
                });
            }
        }, 0));
    };

    const cancelLocalModelSetup = () => {
        localConfirmationPendingRef.current = false;
        if (localCleanupRef.current) return localCleanupRef.current;
        const wasDownloading = downloadInProgressRef.current;
        const controller = localDownloadAbortRef.current;
        localLoadIdRef.current++;
        generationIdRef.current++;
        setLoading(false);
        setAltText('');
        setLocalStatus('');
        controller?.abort();
        methodRef.current = 'api';
        setMethod('api');
        if (imageSrcRef.current && imageLoadReadyRef.current) void generateAltText(imageSrcRef.current, 'api');

        const pendingLoad = pipelinePromiseRef.current;
        const cleanup = (async () => {
            if (pendingLoad) await pendingLoad.catch(() => undefined);

            try {
                await pipelineRef.current?.dispose();
            } catch (err) {
                console.warn('Local model memory release error:', err);
            }
            pipelineRef.current = null;
            setModelReady(false);
            setModelWorking(null);

            if (wasDownloading) {
                try {
                    const { deleteCachedModel, isModelCached: checkCache, hasModelCache } = await import('../lib/localInference');
                    await deleteCachedModel(cacheBeforeDownloadRef.current);
                    const [cached, cachePresent] = await Promise.all([checkCache(), hasModelCache()]);
                    setModelCached(cached);
                    setModelCachePresent(cachePresent);
                } catch (err) {
                    console.error('Cancelled model cleanup error:', err);
                    setError('The cancelled local model download could not be removed from this browser.');
                }
            }

            downloadInProgressRef.current = false;
            setDownloadProgress(null);
            setDownloadedBytes(null);
            setDownloadTotalBytes(null);
            setLocalStatus('');
        })();
        localCleanupRef.current = cleanup;
        void cleanup.finally(() => { if (localCleanupRef.current === cleanup) localCleanupRef.current = null; });
        return cleanup;
    };

    const deleteLocalModel = async () => {
        if (loading || pipelinePromiseRef.current || localCleanupRef.current) return;
        setDeletingModel(true);
        const previousPipeline = pipelineRef.current;
        pipelineRef.current = null;
        localCaptionRef.current = null;
        setModelCached(false);
        setModelCachePresent(false);
        setModelReady(false);
        setModelWorking(null);
        setLocalStatus('');
        if (methodRef.current === 'local') changeMethod('api');

        const cleanup = (async () => {
            try {
                await previousPipeline?.dispose();
                const { deleteCachedModel } = await import('../lib/localInference');
                await deleteCachedModel();
            } catch (err) {
                console.error('Model cache removal error:', err);
                try {
                    const { isModelCached, hasModelCache } = await import('../lib/localInference');
                    const [cached, present] = await Promise.all([isModelCached(), hasModelCache()]);
                    setModelCached(cached);
                    setModelCachePresent(present);
                } catch { /* Leave cache state unknown until the next check. */ }
                setError('The local model could not be removed from this browser.');
            } finally {
                setDeletingModel(false);
            }
        })();
        localCleanupRef.current = cleanup;
        try {
            await cleanup;
        } finally {
            if (localCleanupRef.current === cleanup) localCleanupRef.current = null;
        }
    };

    const changeOutputStyle = (style: OutputStyle) => {
        if (style === outputStyle) return;
        outputStyleRef.current = style;
        flushSync(() => setOutputStyle(style));
        if (imageSrc && imageLoadReadyRef.current && !localConfirmationPendingRef.current) {
            void generateAltText(imageSrc, methodRef.current, style, MIN_GENERATION_DISPLAY_MS);
        }
    };

    return {
        imageSrc,
        imageVersion,
        imageUploadVersion,
        handlePreviewLoaded,
        imageUrlInput, setImageUrlInput,
        altText,
        error, setError,
        urlError, setUrlError,
        loading,
        imageValidated,
        copied,
        method, changeMethod, prepareLocalModel,
        deleteLocalModel,
        cancelLocalModelSetup,
        deletingModel,
        outputStyle, setOutputStyle: changeOutputStyle,
        localStatus, modelReady, modelCached, modelCachePresent, modelWorking, apiWorking, downloadProgress, downloadedBytes, downloadTotalBytes,
        handleUpload,
        removeImage,
        handleUrlSubmit,
        handleCopy,
    };
}
