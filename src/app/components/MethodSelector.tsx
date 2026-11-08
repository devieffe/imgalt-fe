import { useState } from 'react';
import type { Method } from '../hooks/useAltText';

interface Props {
    method: Method;
    localStatus: string;
    modelReady: boolean;
    modelCached: boolean;
    onChange: (m: Method) => void;
}

export default function MethodSelector({ method, localStatus, modelReady, modelCached, onChange }: Props) {
    const [confirming, setConfirming] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [pending, setPending] = useState<Method | null>(null);

    const handleChange = (next: Method) => {
        if (next === 'local' && method !== 'local' && !modelCached && !modelReady) {
            setPending(next);
            setConfirming(true);
            setConfirmVisible(true);
        } else {
            setConfirming(false);
            setPending(null);
            if (confirmVisible) setConfirmVisible(false);
            onChange(next);
        }
    };

    const handleConfirm = () => {
        setConfirming(false);
        setPending(null);
        if (pending) onChange(pending);
    };

    const handleCancel = () => {
        setConfirming(false);
        setPending(null);
        setConfirmVisible(false);
    };

    return (
        <>
            <div className="methodRow">
                <label className="methodLabel" htmlFor="method-select">Method</label>
                <select
                    id="method-select"
                    aria-label="Generation method"
                    className="methodSelect"
                    value={pending ?? method}
                    onChange={(e) => handleChange(e.target.value as Method)}
                >
                    <option value="api">API: OpenAI GPT</option>
                    <option value="local">Local: Transformers.js (less stable, not recommended)</option>
                </select>
            </div>

            <div
                className={`confirmPanel advancedBody${confirmVisible ? ' advancedBodyOpen' : ''}`}
                aria-hidden={!confirmVisible}
                inert={!confirmVisible}
                onTransitionEnd={(event) => {
                    if (event.target === event.currentTarget && !confirming) setConfirmVisible(false);
                }}
            >
                <div className="advancedInner">
                    <div className="confirmBox" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-description">
                        <p id="confirm-title" className="confirmTitle">Use local image model?</p>
                        <p id="confirm-description" className="confirmText">
                            Local mode runs entirely in your browser. First use downloads the model (~150 MB); subsequent runs are instant. Continue?
                        </p>
                        <div className="confirmActions">
                            <button
                                className="confirmOk"
                                type="button"
                                onClick={handleConfirm}
                            >Continue</button>
                            <button className="confirmCancel" type="button" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`localStatusReveal${localStatus && !modelReady ? ' localStatusRevealOpen' : ''}`}
                aria-hidden={!localStatus || modelReady}
                inert={!localStatus || modelReady}
            >
                <div className="localStatusRevealInner">
                    <div role="status" className="alert alertLoading">
                        <span className="spinner" aria-hidden="true" />
                        {localStatus}
                    </div>
                </div>
            </div>
        </>
    );
}
