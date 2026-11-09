'use client';
import { useState, useEffect, useRef } from 'react';
import ContentBox from './ContentBox';
import { usePanel } from '../hooks/usePanel';
import RevealPanel from './RevealPanel';
import SmoothHeight from './SmoothHeight';

interface Props {
    loading: boolean;
    imageValidated: boolean;
    altText: string;
    error: string;
    blocked?: boolean;
    retainWhileUploading?: boolean;
    copied: boolean;
    onCopy: () => void;
}

export default function ResultBox({ loading, imageValidated, altText, error, blocked = false, retainWhileUploading = false, copied, onCopy }: Props) {
    const { isOpen, openPanel, closePanel } = usePanel();
    const [mounted, setMounted] = useState(false);
    const [displayed, setDisplayed] = useState('');
    const lastContent = useRef({ loading, displayed: '', altText, copied });
    const shouldOpen = !error && !blocked && imageValidated && (loading || Boolean(altText));
    const keepOpen = shouldOpen || (!error && !blocked && retainWhileUploading && mounted);

    useEffect(() => {
        if (keepOpen) {
            setMounted(true);
        } else {
            closePanel();
        }
    }, [keepOpen, closePanel]);

    useEffect(() => {
        if (!mounted || !keepOpen) return;
        let openFrame = 0;
        const revealFrame = window.requestAnimationFrame(() => {
            openFrame = window.requestAnimationFrame(openPanel);
        });
        return () => {
            window.cancelAnimationFrame(revealFrame);
            window.cancelAnimationFrame(openFrame);
        };
    }, [mounted, keepOpen, openPanel]);

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

    useEffect(() => {
        if (shouldOpen) lastContent.current = { loading, displayed, altText, copied };
    }, [shouldOpen, loading, displayed, altText, copied]);

    if (!mounted) return null;
    const content = shouldOpen ? { loading, displayed, altText, copied } : lastContent.current;

    return (
        <RevealPanel className="messageReveal" open={isOpen} onClosed={() => setMounted(false)}>
            <SmoothHeight>
            <ContentBox kind="result" loading={content.loading} copied={content.copied} onCopy={shouldOpen && content.altText ? onCopy : undefined}>
                {content.loading ? 'Generating alt text…' : content.displayed}
            </ContentBox>
            </SmoothHeight>
        </RevealPanel>
    );
}
