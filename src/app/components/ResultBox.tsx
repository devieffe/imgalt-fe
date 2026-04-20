'use client';
import { useState, useEffect, useRef } from 'react';

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
                <div className={`resultLoading${fadingOut ? ' resultLoadingFade' : ''}`}>
                    <span className="spinnerGreen" role="status" aria-label="Generating" />
                    Generating alt text…
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
                        <span className="material-icons">{copied ? 'check_box' : 'content_copy'}</span>
                    </button>
                    <p className="altText">{displayed}</p>
                </>
            )}
        </div>
    );
}
