'use client';
import { useState, useEffect, useRef } from 'react';
import ContentBox from './ContentBox';
import { usePanel } from '../hooks/usePanel';
import RevealPanel from './RevealPanel';
import SmoothHeight from './SmoothHeight';

const loadingMessage = 'Generating alt text...';

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
    const [loadingText, setLoadingText] = useState('');
    const [phase, setPhase] = useState<'ready' | 'fading' | 'preparing' | 'loading' | 'closing' | 'revealing'>('ready');
    const displayedRef = useRef('');
    const lastContent = useRef({ loading, displayed: '', altText, copied });
    const shouldOpen = !error && !blocked && imageValidated && (loading || Boolean(altText));
    const keepOpen = shouldOpen || (!error && !blocked && retainWhileUploading && mounted);
    const showLoading = phase === 'loading' || phase === 'preparing' || phase === 'closing' || (loading && !displayedRef.current);

    useEffect(() => {
        if (!showLoading) {
            setLoadingText('');
            return;
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setLoadingText(loadingMessage);
            return;
        }

        let length = 0;
        setLoadingText('');
        const id = window.setInterval(() => {
            length += 1;
            setLoadingText(loadingMessage.slice(0, length));
            if (length >= loadingMessage.length) window.clearInterval(id);
        }, 18);

        return () => window.clearInterval(id);
    }, [showLoading]);

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
        if (!altText) {
            if (!loading) {
                displayedRef.current = '';
                setDisplayed('');
            }
            return;
        }
        const capitalized = altText.charAt(0).toUpperCase() + altText.slice(1);
        displayedRef.current = '';
        setDisplayed('');
        setPhase('closing');
        let closeTimer: number | undefined;
        let revealFrame = 0;
        closeTimer = window.setTimeout(() => {
            setPhase('revealing');
            revealFrame = window.requestAnimationFrame(() => setPhase('ready'));
        }, 120);
        let i = 0;
        const id = setInterval(() => {
            i++;
            const next = capitalized.slice(0, i);
            displayedRef.current = next;
            setDisplayed(next);
            if (i >= capitalized.length) clearInterval(id);
        }, 18);
        return () => {
            if (closeTimer !== undefined) window.clearTimeout(closeTimer);
            window.cancelAnimationFrame(revealFrame);
            clearInterval(id);
        };
    }, [altText, loading]);

    useEffect(() => {
        if (!loading) return;
        if (!displayedRef.current) {
            setPhase('loading');
            return;
        }

        setPhase('fading');
        let shrinkTimer: number | undefined;
        const fadeTimer = window.setTimeout(() => {
            displayedRef.current = '';
            setDisplayed('');
            setPhase('preparing');
            shrinkTimer = window.setTimeout(() => setPhase('loading'), 300);
        }, 120);
        return () => {
            window.clearTimeout(fadeTimer);
            if (shrinkTimer !== undefined) window.clearTimeout(shrinkTimer);
        };
    }, [loading]);

    useEffect(() => {
        if (shouldOpen) lastContent.current = { loading, displayed, altText, copied };
    }, [shouldOpen, loading, displayed, altText, copied]);

    if (!mounted) return null;
    const content = shouldOpen ? { loading, displayed, altText, copied } : lastContent.current;

    return (
        <RevealPanel className="messageReveal" open={isOpen} onClosed={() => setMounted(false)}>
            <SmoothHeight>
            <div className={`resultBoxContent resultBoxContent--${phase}`}>
                <ContentBox kind="result" loading={showLoading} copied={content.copied} onCopy={shouldOpen && !loading && content.altText ? onCopy : undefined}>
                    {showLoading ? <span aria-hidden="true">{loadingText}</span> : phase === 'fading' ? displayed : content.displayed}
                </ContentBox>
            </div>
            </SmoothHeight>
        </RevealPanel>
    );
}
