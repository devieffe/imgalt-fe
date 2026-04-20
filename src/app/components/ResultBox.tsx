interface Props {
    loading: boolean;
    altText: string;
    copied: boolean;
    onCopy: () => void;
}

export default function ResultBox({ loading, altText, copied, onCopy }: Props) {
    if (loading) {
        return (
            <div role="status" className="alert alertLoading">
                <span className="spinner" />
                Generating alt text…
            </div>
        );
    }

    if (!altText) return null;

    return (
        <>
            <div className="alert alertSuccess">
                <div className="alertSuccessHeader">
                    <span className="material-icons">check_circle</span>
                    <span>Alt text generated</span>
                    <button
                        onClick={onCopy}
                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                        aria-label="Copy alt text"
                        className="copyBtn"
                        data-copied={copied}
                    >
                        <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <p className="altText">{altText}</p>
            </div>

            {copied && (
                <div role="status" className="toast">
                    <span className="material-icons">check</span>
                    Copied to clipboard
                </div>
            )}
        </>
    );
}
