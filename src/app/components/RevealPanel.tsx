import type { ReactNode, TransitionEvent } from 'react';

interface Props {
    open: boolean;
    children: ReactNode;
    className?: string;
    onClosed?: () => void;
}

export default function RevealPanel({ open, children, className, onClosed }: Props) {
    const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && event.propertyName === 'grid-template-rows' && !open) {
            onClosed?.();
        }
    };

    return (
        <div
            className={`advancedBody${open ? ' advancedBodyOpen' : ''}${className ? ` ${className}` : ''}`}
            aria-hidden={!open}
            inert={!open}
            onTransitionEnd={handleTransitionEnd}
        >
            <div className="advancedInner">{children}</div>
        </div>
    );
}
