import { useEffect, useRef, useState } from 'react';
import ContentBox from './ContentBox';
import { usePanel } from '../hooks/usePanel';
import RevealPanel from './RevealPanel';
import SmoothHeight from './SmoothHeight';

interface Props {
    message?: string;
    variant?: 'banner' | 'inline';
    id?: string;
    onDismiss?: () => void;
    keepUntilClosed?: boolean;
    timerResetKey?: number;
    onVisibilityChange?: (visible: boolean) => void;
}

export default function Message({ message, variant = 'banner', id, onDismiss, keepUntilClosed = false, timerResetKey, onVisibilityChange }: Props) {
    const { isOpen, openPanel, closePanel } = usePanel();
    const [displayMessage, setDisplayMessage] = useState('');
    const onDismissRef = useRef(onDismiss);
    const onVisibilityChangeRef = useRef(onVisibilityChange);

    useEffect(() => {
        onDismissRef.current = onDismiss;
        onVisibilityChangeRef.current = onVisibilityChange;
    }, [onDismiss, onVisibilityChange]);

    useEffect(() => {
        if (keepUntilClosed) return;
        if (message) {
            setDisplayMessage(message);
            openPanel();
        } else {
            closePanel();
        }
    }, [message, keepUntilClosed, openPanel, closePanel]);

    useEffect(() => {
        if (keepUntilClosed && message && !displayMessage) {
            onVisibilityChangeRef.current?.(true);
            setDisplayMessage(message);
            openPanel();
        }
    }, [keepUntilClosed, message, displayMessage, openPanel]);

    const timerMessage = keepUntilClosed ? displayMessage : message;
    useEffect(() => {
        if (!timerMessage) return;

        openPanel();
        const fadeTimer = window.setTimeout(closePanel, 8000);
        const dismissTimer = window.setTimeout(() => {
            if (!keepUntilClosed) onDismissRef.current?.();
        }, 8600);

        return () => {
            window.clearTimeout(fadeTimer);
            window.clearTimeout(dismissTimer);
        };
    }, [keepUntilClosed, timerMessage, timerResetKey, openPanel, closePanel]);

    if (!displayMessage && !message) return null;

    return (
        <RevealPanel className="messageReveal" open={isOpen} onClosed={() => {
            if (keepUntilClosed && message === displayMessage) onDismissRef.current?.();
            setDisplayMessage('');
            onVisibilityChangeRef.current?.(false);
        }}>
            <SmoothHeight>
            <ContentBox kind="alert" id={id} inline={variant === 'inline'} onDismiss={onDismiss ? () => { closePanel(); onDismiss(); } : undefined} active={isOpen}>
                {displayMessage}
            </ContentBox>
            </SmoothHeight>
        </RevealPanel>
    );
}
