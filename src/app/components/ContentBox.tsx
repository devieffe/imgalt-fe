import type { ReactNode } from 'react';
import Icon from './Icon';

interface Props {
    children: ReactNode;
    kind: 'result' | 'alert';
    id?: string;
    inline?: boolean;
    loading?: boolean;
    copied?: boolean;
    onCopy?: () => void;
    onDismiss?: () => void;
    active?: boolean;
}

export default function ContentBox({ children, kind, id, inline, loading, copied, onCopy, onDismiss, active = true }: Props) {
    const className = `contentBox contentBox${kind === 'alert' ? 'Alert' : 'Result'}${inline ? ' contentBoxInline' : ''}`;
    const icon = (
        <span className="contentBoxIcon" aria-hidden="true">
            {loading ? <span className="spinnerGreen" /> : <Icon name={kind === 'alert' ? 'close' : 'copied'} />}
        </span>
    );
    const text = <span className="contentBoxText" role={loading ? 'status' : undefined} aria-live={kind === 'result' ? 'polite' : undefined}>{children}</span>;

    if (kind === 'result') {
        return (
            <div className={`${className}${loading ? ' contentBoxLoading' : ''}`}>
                {loading && icon}
                {text}
                {!loading && <span className="contentBoxAction" aria-hidden="true"><Icon name={copied ? 'copied' : 'copy'} /></span>}
                <button type="button" className="contentBoxCopy" onClick={onCopy} disabled={loading || !onCopy}
                    aria-label={copied ? 'Alt text copied' : 'Copy alt text'} title={copied ? 'Copied!' : 'Copy to clipboard'} />
            </div>
        );
    }

    return (
        <div id={id} role={active ? 'alert' : undefined} className={className}>
            {text}
            {!inline && onDismiss && (
                <button type="button" onClick={onDismiss} className="contentBoxAction" aria-label="Dismiss error">
                    <Icon name="close" />
                </button>
            )}
        </div>
    );
}
