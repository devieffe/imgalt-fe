import { useEffect, useState } from 'react';

const text = 'Accessible alt text for images using AI';

export default function Subtitle() {
    const [length, setLength] = useState(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setLength(text.length);
            return;
        }

        let interval: number | undefined;
        const delay = window.setTimeout(() => {
            interval = window.setInterval(() => {
                setLength(current => {
                    const next = Math.min(current + 1, text.length);
                    if (next === text.length) window.clearInterval(interval);
                    return next;
                });
            }, 10);
        }, 100);

        return () => {
            window.clearTimeout(delay);
            window.clearInterval(interval);
        };
    }, []);

    return (
        <p className="subtitle">
            <span className="subtitleMeasure">{text}</span>
            <span className="subtitleTyped" aria-hidden="true">{Array.from(text, (character, index) => (
                <span key={index} className={index < length ? undefined : 'subtitleCharacterHidden'}>{character}</span>
            ))}</span>
        </p>
    );
}
