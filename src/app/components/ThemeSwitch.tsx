import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export default function ThemeSwitch() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('imgalt-theme');
            if (saved === 'dark') {
                document.documentElement.dataset.theme = 'dark';
                setTheme('dark');
            }
        } catch {
            // Light mode remains available when storage is disabled.
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        setTheme(next);
        try { localStorage.setItem('imgalt-theme', next); } catch { /* Optional preference. */ }
    };

    return (
        <button className="themeSwitch" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
    );
}
