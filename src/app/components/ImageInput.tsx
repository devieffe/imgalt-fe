import { useRef, useEffect } from 'react';
import Icon from './Icon';

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
            <div id="image-url-form" className={`urlSlide${urlOpen ? ' urlSlideOpen' : ''}`} aria-hidden={!urlOpen}>
                <div className="urlSlideInner" inert={!urlOpen}>
                    <div className="urlRow">
                        <input
                            ref={urlInputRef}
                            type="url"
                            inputMode="url"
                            aria-label="Image URL"
                            aria-invalid={Boolean(urlError)}
                            aria-describedby={urlError ? 'image-url-error' : undefined}
                            value={value}
                            onChange={(e) => {
                                onChange(e.target.value);
                                urlInputRef.current?.setCustomValidity('');
                            }}
                            placeholder="Paste image URL (.jpg, .jpeg, .png, .webp)"
                            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                            className="input"
                        />
                        <div className="submitGroup">
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
                    {urlError && <p id="image-url-error" className="fieldError">{urlError}</p>}
                </div>
            </div>

            <label className="uploadLabel">
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="hidden" aria-label="Upload image" />
                <span className="uploadBtn">
                    <Icon name="upload" />
                    Upload image
                </span>
            </label>
        </div>
    );
}
