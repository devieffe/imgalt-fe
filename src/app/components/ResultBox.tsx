'use client';
import { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface Props {
    loading: boolean;
    altText: string;
    copied: boolean;
    onCopy: () => void;
}

export default function ResultBox({ loading, altText, copied, onCopy }: Props) {
    const [displayed, setDisplayed] = useState('');
    const [fadingOut, setFadingOut] = useState(false);
    const prevLoading = useRef(false);

    useEffect(() => {
        if (prevLoading.current && !loading) {
            setFadingOut(true);
            const t = setTimeout(() => setFadingOut(false), 400);
            prevLoading.current = false;
            return () => clearTimeout(t);
        }
        prevLoading.current = loading;
    }, [loading]);

    useEffect(() => {
        if (!altText) { setDisplayed(''); return; }
        const capitalized = altText.charAt(0).toUpperCase() + altText.slice(1);
        setDisplayed('');
        let i = 0;
        const id = setInterval(() => {
            i++;
            setDisplayed(capitalized.slice(0, i));
            if (i >= capitalized.length) clearInterval(id);
        }, 18);
        return () => clearInterval(id);
    }, [altText]);

    if (!loading && !fadingOut && !altText) return null;

    return (
        <div className="resultBox">
            {(loading || fadingOut) && (
                <div className={`resultLoading${fadingOut ? ' resultLoadingFade' : ''}`} role="status" aria-live="polite">
                    <span className="spinnerGreen" aria-hidden="true" />
                    <span>Generating alt text…</span>
                </div>
            )}
            {!loading && !fadingOut && altText && (
                <>
                    <button
                        onClick={onCopy}
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                        aria-label="Copy alt text"
                        className="copyBtn"
                    >
                        <Icon name={copied ? 'copied' : 'copy'} />
                    </button>
                    <p className="altText" aria-live="polite">{displayed}</p>
                </>
            )}
        </div>
    );
}
