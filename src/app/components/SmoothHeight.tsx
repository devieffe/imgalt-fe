import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function SmoothHeight({ children }: Props) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>();

    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content || typeof ResizeObserver === 'undefined') return;

        const updateHeight = () => setHeight(content.getBoundingClientRect().height);
        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(content);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="smoothHeight" style={height === undefined ? undefined : { height }}>
            <div ref={contentRef}>{children}</div>
        </div>
    );
}
