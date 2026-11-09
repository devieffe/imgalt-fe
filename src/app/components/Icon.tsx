import type { SVGProps } from 'react';

type Name = 'upload' | 'copy' | 'copied' | 'terminal' | 'close' | 'plus' | 'minus' | 'chevronDown' | 'chevronUp' | 'trash' | 'download';

const paths: Record<Name, React.ReactNode> = {
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M20 16.5v3A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-3" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    copied: <path d="m5 12 4 4L19 6" />,
    terminal: <path d="m8 5 7 7-7 7" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronUp: <path d="m6 15 6-6 6 6" />,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 17v3h16v-3" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
};

interface Props extends SVGProps<SVGSVGElement> {
    name: Name;
}

export default function Icon({ name, ...props }: Props) {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {paths[name]}
        </svg>
    );
}
