import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import type { Method } from '../hooks/useAltText';
import { API_MODEL, LOCAL_MODELS, LOCAL_DOWNLOAD_ESTIMATE_MB } from '../lib/modelInfo';
import { usePanel } from '../hooks/usePanel';
import Icon from './Icon';
import RevealPanel from './RevealPanel';

interface Props {
    open: boolean;
    method: Method;
    localStatus: string;
    modelReady: boolean;
    modelCached: boolean;
    modelCachePresent: boolean;
    modelWorking: boolean | null;
    apiWorking: boolean | null;
    downloadProgress: number | null;
    downloadedBytes: number | null;
    downloadTotalBytes: number | null;
    onChange: (m: Method) => void;
    onPrepareLocalModel: () => void;
    onDeleteLocalModel: () => void;
    onCancelLocalModelSetup: () => void;
    deleteDisabled: boolean;
}

export default function MethodSelector({ open, method, localStatus, modelReady, modelCached, modelWorking, apiWorking, downloadProgress, downloadedBytes, downloadTotalBytes, onChange, onPrepareLocalModel, onDeleteLocalModel, onCancelLocalModelSetup, deleteDisabled }: Props) {
    const { isOpen: menuOpen, openPanel: openMenuPanel, closePanel: closeMenuPanel } = usePanel();
    const selectorRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const { isOpen: confirmOpen, openPanel: openConfirmPanel, closePanel: closeConfirmPanel } = usePanel();
    const [pending, setPending] = useState<Method | null>(null);
    const isInitializing = localStatus === 'downloading' || localStatus === 'Loading model into memory…';
    const showLocalAction = (pending ?? method) === 'local';
    const showDeleteModel = showLocalAction && (modelReady || modelCached) && modelWorking !== false;

    useEffect(() => {
        if (modelReady && confirmOpen) {
            const closeTimer = window.setTimeout(() => {
                closeConfirmPanel();
            }, 900);
            return () => window.clearTimeout(closeTimer);
        }
    }, [modelReady, confirmOpen, closeConfirmPanel]);

    const localAvailability = (modelReady || modelCached) && modelWorking !== false;
    const options: { value: Method; label: string; available: boolean | null }[] = [
        { value: 'api', label: `API: ${API_MODEL.label}`, available: apiWorking },
        { value: 'local', label: `Local: ${LOCAL_MODELS.caption.label}${modelWorking === false ? ' (Unavailable)' : modelReady || modelCached ? '' : ' (Needs download)'}`, available: localAvailability },
    ];
    const renderOption = (option: typeof options[number]) => (
        <>
            {option.available !== null && <span className={`methodStatus ${option.available ? 'methodStatusAvailable' : 'methodStatusUnavailable'}`} aria-hidden="true" />}
            <span className="methodOptionText">{option.label}</span>
            {option.available !== null && <span className="methodStatusText">{option.available ? 'Available' : 'Unavailable'}</span>}
        </>
    );
    const selectedMethod = pending ?? method;
    const availableOptions = options.filter(option => option.value !== selectedMethod);

    const openMenu = () => {
        openMenuPanel();
    };

    useEffect(() => {
        if (!open) closeMenuPanel();
    }, [open, closeMenuPanel]);

    useEffect(() => {
        if (!menuOpen) return;
        optionRefs.current[0]?.focus();
        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!selectorRef.current?.contains(event.target as Node)) closeMenuPanel();
        };
        document.addEventListener('pointerdown', closeOnOutsideClick);
        return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, [menuOpen, closeMenuPanel]);

    const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let nextIndex = index;
        if (event.key === 'ArrowDown') nextIndex = (index + 1) % availableOptions.length;
        else if (event.key === 'ArrowUp') nextIndex = (index - 1 + availableOptions.length) % availableOptions.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = availableOptions.length - 1;
        else if (event.key === 'Escape') {
            event.preventDefault();
            closeMenuPanel();
            triggerRef.current?.focus();
            return;
        } else if (event.key === 'Tab') {
            closeMenuPanel();
            return;
        } else return;
        event.preventDefault();
        optionRefs.current[nextIndex]?.focus();
    };

    const handleChange = (next: Method) => {
        if (next === "local" && isInitializing) {
            setPending(null);
            openConfirmPanel();
            onChange(next);
            return;
        }
        if (next === 'local' && method !== 'local' && !modelReady && (!modelCached || modelWorking === false)) {
            setPending(next);
            onPrepareLocalModel();
            openConfirmPanel();
        } else {
            setPending(null);
            closeConfirmPanel();
            onChange(next);
        }
    };

    const handleConfirm = () => {
        if (isInitializing) return;
        const methodToLoad = pending ?? (method === 'local' ? 'local' : null);
        if (methodToLoad) {
            openConfirmPanel();
            onChange(methodToLoad);
            setPending(null);
        }
    };

    const handleCancel = () => {
        setPending(null);
        closeConfirmPanel();
        if (isInitializing || method === 'local') void onCancelLocalModelSetup();
        else if (pending && method === 'api') onChange('api');
    };

    return (
        <>
            <div className="methodSelectorGroup">
            <div className="methodRow" ref={selectorRef}>
                <span className="methodLabel" id="method-label">Method</span>
                <div className="methodDropdown">
                <div className="methodInputRow">
                    <button
                        ref={triggerRef}
                        id="method-select"
                        type="button"
                        aria-labelledby="method-label method-value"
                        aria-haspopup="listbox"
                        aria-expanded={menuOpen}
                        aria-controls="method-options"
                        className={`methodSelect${showLocalAction ? ' methodSelectWithDelete' : ''}`}
                        onClick={() => menuOpen ? closeMenuPanel() : openMenu()}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                event.preventDefault();
                                openMenu();
                            }
                        }}
                    >
                        <span id="method-value" className="methodValue">{renderOption(options.find(option => option.value === selectedMethod)!)}</span>
                        {!showLocalAction && <Icon name={menuOpen ? 'chevronUp' : 'chevronDown'} className="methodChevron" />}
                    </button>
                    {showLocalAction && (
                        <button
                            className="deleteModelButton"
                            type="button"
                            onClick={showDeleteModel ? onDeleteLocalModel : () => {
                                if (isInitializing) return;
                                onPrepareLocalModel();
                                setPending('local');
                                openConfirmPanel();
                            }}
                            disabled={showDeleteModel ? deleteDisabled : isInitializing}
                            aria-label={showDeleteModel ? 'Delete downloaded local model' : 'Download local model'}
                            title={showDeleteModel ? 'Delete downloaded local model' : 'Download local model'}
                        >
                            <Icon name={showDeleteModel ? 'trash' : 'download'} />
                        </button>
                    )}
                </div>
                <RevealPanel open={menuOpen}>
                    <div id="method-options" className="methodOptions" role="listbox" aria-labelledby="method-label">
                        {availableOptions.map((option, index) => (
                            <button
                                key={option.value}
                                ref={element => { optionRefs.current[index] = element; }}
                                type="button"
                                role="option"
                                aria-selected={false}
                                tabIndex={-1}
                                className="methodOption"
                                onKeyDown={event => handleOptionKeyDown(event, index)}
                                onClick={() => {
                                    flushSync(() => {
                                        closeMenuPanel();
                                        handleChange(option.value);
                                    });
                                    triggerRef.current?.focus();
                                }}
                            >
                                {renderOption(option)}
                            </button>
                        ))}
                    </div>
                </RevealPanel>
                </div>
            </div>

            <RevealPanel open={confirmOpen}>
                    <div className="confirmBox" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-description">
                        <p id="confirm-title" className="confirmTitle">Use local image model?</p>
                        <p id="confirm-description" className="confirmText">
                            Download <strong>{LOCAL_MODELS.caption.label} &amp; {LOCAL_MODELS.rephrase.label}</strong> from HuggingFace.co to browser cache ~{LOCAL_DOWNLOAD_ESTIMATE_MB} MB for local image descriptions and rephrasing. Results may be less consistent than API models. Do you wish to continue?
                        </p>
                        <div className="confirmActions">
                            <button
                                className={`confirmOk${isInitializing || modelReady ? ' confirmOkProgress' : ''}`}
                                type="button"
                                onClick={handleConfirm}
                                disabled={isInitializing || modelReady}
                                style={{ '--download-progress': `${modelReady ? 100 : Math.max(0, Math.min(100, downloadProgress ?? 0))}%` } as CSSProperties}
                            >
                                <span aria-live="polite">{modelReady
                                    ? 'Downloaded'
                                    : localStatus === 'downloading'
                                        ? `Downloading ${formatMegabytes(downloadedBytes) ?? '0 MB'} / ~${formatMegabytes(downloadTotalBytes) ?? `${LOCAL_DOWNLOAD_ESTIMATE_MB} MB`}`
                                        : localStatus === 'Loading model into memory…' ? 'Loading model…' : 'Continue'}</span>
                            </button>
                            <button className="confirmCancel" type="button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
            </RevealPanel>
            </div>

        </>
    );
}

function formatMegabytes(bytes: number | null) {
    if (bytes === null || bytes <= 0) return null;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
