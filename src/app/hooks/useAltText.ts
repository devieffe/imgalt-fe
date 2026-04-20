'use client';

import { useState, useRef, useEffect } from 'react';
import type { ImageToTextPipeline } from '@huggingface/transformers';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;

export type Method = 'api' | 'local';

export function useAltText() {
    const [imageSrc, setImageSrc] = useState('');
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [altText, setAltText] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [method, setMethod] = useState<Method>('api');
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
        setAltText('');
        setError('');
        setCopied(false);
        setLoading(true);

        try {
            if (method === 'local') {
                if (typeof window === 'undefined') {
                    setError('Local model can only run in the browser.');
                    setLoading(false);
                    return;
                }
                const pipe = await getLocalPipeline();
                const result = await pipe(src);
                const text = Array.isArray(result)
                    ? (result[0] as { generated_text: string }).generated_text
                    : '';
                setAltText(text || 'No alt text generated.');
            } else {
                const res = await fetch('/api/imgalt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: src }),
                });
                const data = await res.json();
                if (res.ok) setAltText(data.alt || 'No alt text generated.');
                else setError(data.error || 'Failed to generate alt text.');
            }
        } catch (err) {
            setLocalStatus('');
            const msg = err instanceof Error ? err.message : String(err);
            setError(`Local model error: ${msg}`);
        }

        setLoading(false);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        setAltText('');
        setCopied(false);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only .jpg, .jpeg, and .png files are supported.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setImageSrc(base64);
            generateAltText(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleUrlSubmit = async () => {
        const trimmed = imageUrlInput.trim();
        if (!trimmed) return;

        setError('');
        setAltText('');
        setCopied(false);

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(trimmed);
        } catch {
            setError('Enter a valid image URL.');
            return;
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            setError('Only http and https image URLs are allowed.');
            return;
        }

        if (!ALLOWED_EXTENSIONS.test(parsedUrl.pathname)) {
            setError('Only image URLs ending in .jpg, .jpeg, or .png are allowed.');
            return;
        }

        try {
            const img = new window.Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = trimmed;
            });
            setImageSrc(trimmed);
            generateAltText(trimmed);
        } catch {
            setError("The image URL doesn't exist or cannot be loaded.");
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
        setLocalStatus('');
    };

    return {
        imageSrc,
        imageUrlInput, setImageUrlInput,
        altText,
        error, setError,
        loading,
        copied,
        method, changeMethod,
        localStatus, modelReady, modelCached,
        handleUpload,
        handleUrlSubmit,
        handleCopy,
    };
}
