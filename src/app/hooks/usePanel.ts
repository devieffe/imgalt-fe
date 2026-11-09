'use client';

import { useCallback, useState } from 'react';

export function usePanel(initiallyOpen = false) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);

    const openPanel = useCallback(() => setIsOpen(true), []);
    const closePanel = useCallback(() => setIsOpen(false), []);
    const togglePanel = useCallback(() => setIsOpen(open => !open), []);

    return { isOpen, openPanel, closePanel, togglePanel };
}
