import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface Props {
    src: string;
    version: number;
    onLoad?: (src: string) => void;
}

export default function ImagePreview({ src, version, onLoad }: Props) {
    const [preview, setPreview] = useState({ src, version, width: 0, height: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [revealEnded, setRevealEnded] = useState(false);
    const reportedRef = useRef(false);

    useEffect(() => {
        if (preview.version === version) return;
        let cancelled = false;
        const image = new window.Image();
        const showImage = () => {
            if (cancelled) return;
            reportedRef.current = false;
            setImageLoaded(false);
            setRevealEnded(false);
            setPreview({ src, version, width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onload = showImage;
        image.onerror = showImage;
        image.src = src;
        return () => { cancelled = true; image.onload = null; image.onerror = null; };
    }, [src, version, preview.version]);

    useEffect(() => {
        if (preview.version !== version || !imageLoaded || !revealEnded || reportedRef.current) return;
        reportedRef.current = true;
        onLoad?.(preview.src);
    }, [imageLoaded, onLoad, revealEnded, preview, version]);

    useEffect(() => {
        if (!imageLoaded || revealEnded) return;
        const fallback = window.setTimeout(() => setRevealEnded(true), 500);
        return () => window.clearTimeout(fallback);
    }, [imageLoaded, revealEnded]);

    if (!preview.src) return null;
    return (
        <span key={preview.version} className="preview" onAnimationEnd={() => setRevealEnded(true)}>
            <Image
                src={preview.src}
                alt="Preview of the selected image"
                unoptimized
                draggable={false}
                width={preview.width}
                height={preview.height}
                sizes="100vw"
                className="previewImg"
                onLoad={() => setImageLoaded(true)}
            />
        </span>
    );
}
