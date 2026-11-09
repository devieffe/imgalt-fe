import { useRef, useState, type ReactNode } from 'react';
import Icon from './Icon';
import Message from './Message';
import ImagePreview from './ImagePreview';
import SmoothHeight from './SmoothHeight';

interface Props {
    urlOpen: boolean;
    urlError?: string;
    value: string;
    onChange: (v: string) => void;
    onUrlErrorDismiss: () => void;
    onSubmit: () => void;
    imageSrc: string;
    imageVersion: number;
    onPreviewLoad: (src: string) => void;
    onUpload: (file: File | null) => void;
    onRemove: () => void;
    children?: ReactNode;
}

export default function ImageInput({ urlOpen, urlError, value, onChange, onUrlErrorDismiss, onSubmit, imageSrc, imageVersion, onPreviewLoad, onUpload, onRemove, children }: Props) {
    const isReady = value.trim().length > 0;
    const [dragOver, setDragOver] = useState(false);
    const [urlFocused, setUrlFocused] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragDepthRef = useRef(0);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onUpload(event.currentTarget.files?.[0] ?? null);
        event.currentTarget.value = '';
    };

    const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        dragDepthRef.current = 0;
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onUpload(file);
    };

    return (
        <div className="uploadAction">
            <div className={`uploadWindow${dragOver ? ' uploadWindowDragOver' : ''}`}>
                <SmoothHeight>
                <button
                    type="button"
                    className={`uploadDropzone${imageSrc ? '' : ' uploadDropzoneEmpty'}`}
                    aria-label={imageSrc ? 'Replace uploaded image' : 'Upload image'}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(event) => {
                        event.preventDefault();
                        if (!Array.from(event.dataTransfer.types).includes('Files')) return;
                        dragDepthRef.current += 1;
                        setDragOver(true);
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes('Files') ? 'copy' : 'none';
                    }}
                    onDragLeave={(event) => {
                        event.preventDefault();
                        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                        if (dragDepthRef.current === 0) setDragOver(false);
                    }}
                    onDragEnd={() => { dragDepthRef.current = 0; setDragOver(false); }}
                    onDrop={handleDrop}
                >
                    {imageSrc ? (
                        <span className="uploadWindowImageContent">
                            <ImagePreview src={imageSrc} version={imageVersion} onLoad={onPreviewLoad} />
                            <span className="uploadReplaceHint"><Icon name="upload" /> Click or drop to replace image</span>
                        </span>
                    ) : (
                        <span className="uploadPrompt">
                            <Icon name="upload" />
                            <span className="uploadPromptTitle">Upload image</span>
                        </span>
                    )}
                </button>
                </SmoothHeight>
                {imageSrc && (
                    <button type="button" className="removeImageButton" onClick={onRemove} aria-label="Remove image" title="Remove image">
                        <Icon name="close" />
                    </button>
                )}
                <div className="uploadWindowResult">{children}</div>
            </div>
            <div id="image-url-form" className={`urlSlide${urlOpen ? ' urlSlideOpen' : ''}`} aria-hidden={!urlOpen}>
                <div className="urlSlideInner" inert={!urlOpen}>
                    <div className="urlRow">
                        <input
                            type="url"
                            inputMode="url"
                            aria-label="Image URL"
                            aria-invalid={Boolean(urlError)}
                            aria-describedby={urlError ? 'image-url-error' : undefined}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={urlFocused ? '' : 'Paste image URL (.jpg, .jpeg, .png, .webp)'}
                            onFocus={() => setUrlFocused(true)}
                            onBlur={() => setUrlFocused(false)}
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
                    <Message message={urlError} variant="inline" id="image-url-error" onDismiss={onUrlErrorDismiss} />
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="uploadFileInput"
                tabIndex={-1}
                aria-hidden="true"
            />
        </div>
    );
}
