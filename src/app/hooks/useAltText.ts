'use client';

import { useState, useRef, useEffect } from 'react';
import type { ImageToTextPipeline } from '@huggingface/transformers';
import type { OutputStyle } from '../lib/styleRules';

export type { OutputStyle };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const MAX_FILE_SIZE = 6 * 1024 * 1024;

export type Method = 'api' | 'local';

export function useAltText() {
    const [imageSrc, setImageSrc] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [altText, setAltText] = useState('');
    const [error, setError] = useState('');
    const [urlError, setUrlError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [method, setMethod] = useState<Method>('api');
    const [outputStyle, setOutputStyle] = useState<OutputStyle>('normal');
    const [localStatus, setLocalStatus] = useState('');
    const [modelReady, setModelReady] = useState(false);
    const [modelCached, setModelCached] = useState(false);
    const pipelineRef = useRef<ImageToTextPipeline | null>(null);

    useEffect(() => {
        import('../lib/localInference')
            .then(m => m.isModelCached())
            .then(setModelCached)
            .catch(() => { });
    }, []);

    const getLocalPipeline = async (): Promise<ImageToTextPipeline> => {
        if (pipelineRef.current) return pipelineRef.current;
        try {
                const { loadImageCaptionPipeline, isModelCached: checkCache } = await import('../lib/localInference');
            const cached = modelCached || await checkCache();
            if (!cached) {
                setLocalStatus('Downloading model… (~150 MB, first run only)');
            }
            const pipe = await loadImageCaptionPipeline((p: { status: string; progress?: number }) => {
                if (!cached) {
                    if (p.status === 'downloading' && p.progress != null) {
                        setLocalStatus(`Downloading model… ${Math.round(p.progress)}%`);
                    } else if (p.status === 'loading') {
                        setLocalStatus('Loading model into memory…');
                    }
                }
            });
            pipelineRef.current = pipe;
            setModelReady(true);
            setModelCached(true);
            setLocalStatus('');
            return pipe;
        } catch (err) {
            setLocalStatus('');
            console.error('Pipeline load error:', err);
            throw err;
        }
    };

    const generateAltText = async (src: string) => {
        if (!src) return;
        setAltText('');
        setError('');
        setCopied(false);
        setLoading(true);

        let requestTimeout: number | undefined;
        try {
            if (method === 'local') {
                if (typeof window === 'undefined') {
                    setError('Local model can only run in the browser.');
                    setLoading(false);
                    return;
                }
                const pipe = await getLocalPipeline();
                const result = await pipe(src);
                const raw = Array.isArray(result)
                    ? (result[0] as { generated_text: string }).generated_text
                    : '';
                setAltText(raw.trim() || 'No alt text generated.');
            } else {
                const controller = new AbortController();
                requestTimeout = window.setTimeout(() => controller.abort(), 60_000);
                const res = await fetch('/api/imgalt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: src, outputStyle }),
                    signal: controller.signal,
                });
                window.clearTimeout(requestTimeout);
                requestTimeout = undefined;
                const data: unknown = await res.json().catch(() => null);
                const result = data && typeof data === 'object' ? data as { alt?: unknown; error?: unknown } : {};
                if (res.ok) setAltText(typeof result.alt === 'string' ? result.alt : 'No alt text generated.');
                else setError(typeof result.error === 'string' ? result.error : 'Failed to generate alt text.');
            }
        } catch (err) {
            if (requestTimeout !== undefined) window.clearTimeout(requestTimeout);
            setLocalStatus('');
            const msg = err instanceof Error ? err.message : String(err);
            setError(err instanceof DOMException && err.name === 'AbortError'
                ? 'The request took too long. Please try again.'
                : method === 'local'
                    ? `Local model error: ${msg}`
                    : 'Image processing failed. Please try again.');
        }

        setLoading(false);
    };

    const handleGenerate = () => generateAltText(imageSrc);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setUrlError('');
        setAltText('');
        setCopied(false);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only JPEG, PNG, and WebP images are supported.');
            e.target.value = '';
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('Choose an image smaller than 6 MB.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                setError('The selected image could not be read.');
                return;
            }
            setImageSrc(reader.result);
            void generateAltText(reader.result);
        };
        reader.onerror = () => setError('The selected image could not be read.');
        reader.readAsDataURL(file);
    };

    const handleUrlSubmit = async () => {
        const trimmed = imageUrlInput.trim();
        if (!trimmed) return;

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

        try {
            const img = new window.Image();
            const imageDataUrl = await new Promise<string>((resolve, reject) => {
                const timeout = window.setTimeout(() => reject(new Error('timeout')), 15_000);
                img.onload = () => {
                    window.clearTimeout(timeout);
                    if (img.naturalWidth * img.naturalHeight > 40_000_000) {
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
                        reject(new Error('cors'));
                    }
                };
                img.onerror = () => {
                    window.clearTimeout(timeout);
                    reject(new Error('load'));
                };
                img.src = parsedUrl.href;
            });
            setImageSrc(imageDataUrl);
            void generateAltText(imageDataUrl);
        } catch (error) {
            setUrlError(error instanceof Error && error.message === 'dimensions'
                ? 'This image is too large to process.'
                : error instanceof Error && error.message === 'timeout'
                    ? 'The image took too long to load.'
                    : 'The image URL could not be loaded. Check that the host allows image access.');
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

    const changeMethod = (m: Method) => {
        setMethod(m);
        setAltText('');
        setError('');
        setUrlError('');
        setLocalStatus('');
    };

    const changeOutputStyle = (style: OutputStyle) => {
        if (style === outputStyle) return;
        setOutputStyle(style);
        if (imageSrc) {
            void generateAltText(imageSrc);
        }
    };

    return {
        imageSrc,
        imageUrlInput, setImageUrlInput,
        altText,
        error, setError,
        urlError, setUrlError,
        loading,
        copied,
        method, changeMethod,
        outputStyle, setOutputStyle: changeOutputStyle,
        localStatus, modelReady, modelCached,
        handleUpload,
        handleUrlSubmit,
        handleCopy,
    };
}
