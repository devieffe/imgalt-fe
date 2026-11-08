import { useRef, useEffect } from 'react';

interface Props {
    urlOpen: boolean;
    urlError?: string;
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageInput({ urlOpen, urlError, value, onChange, onSubmit, onUpload }: Props) {
    const isReady = value.trim().length > 0;
    const urlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = urlInputRef.current;
        if (!el) return;
        el.setCustomValidity(urlError || '');
        if (urlError) el.reportValidity();
    }, [urlError]);

    return (
        <div className="uploadAction">
            <div className={`urlSlide${urlOpen ? ' urlSlideOpen' : ''}`}>
                <div className="urlSlideInner">
                    <div className="urlRow">
                        <input
                            ref={urlInputRef}
                            type="text"
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                urlInputRef.current?.setCustomValidity('');
                            }}
                            placeholder="Paste image URL (.jpg, .jpeg, .png, .webp)"
                            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                            className="input"
                        />
                        <div className="inputFade" aria-hidden="true" />
                        <button
                            onClick={onSubmit}
                            disabled={!isReady}
                            className={`btnPrimary${urlError ? '' : isReady ? ' btnPrimaryReady' : ''}`}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>

            <label className="uploadLabel">
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onUpload} className="hidden" />
                <div className="uploadBtn">
                    <span className="material-icons">upload_file</span>
                    Upload image
                </div>
            </label>
        </div>
    );
}
