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
    const [pending, setPending] = useState<Method | null>(null);

    const handleChange = (next: Method) => {
        if (next === 'local' && method !== 'local' && !modelCached && !modelReady) {
            setPending(next);
            setConfirming(true);
        } else {
            onChange(next);
        }
    };

    const handleConfirm = () => {
        setConfirming(false);
        if (pending) onChange(pending);
        setPending(null);
    };

    const handleCancel = () => {
        setConfirming(false);
        setPending(null);
    };

    return (
        <>
            <div className="methodRow">
                <label className="methodLabel" htmlFor="method-select">Method</label>
                <select
                    id="method-select"
                    className="methodSelect"
                    value={pending ?? method}
                    onChange={(e) => handleChange(e.target.value as Method)}
                >
                    <option value="api">API: OpenAI GPT</option>
                    <option value="local">Local: Transformers.js (less stable, not recommended)</option>
                </select>
            </div>

            {confirming && (
                <div className="confirmBox" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
                    <p id="confirm-title" className="confirmText">
                        Local mode runs entirely in your browser. First use downloads the model (~150 MB); subsequent runs are instant. Continue?
                    </p>
                    <div className="confirmActions">
                        <button
                            className="confirmOk"
                            onClick={handleConfirm}
                        >OK</button>
                        <button
                            className="confirmCancel"
                            onClick={handleCancel}
                        >Cancel</button>
                    </div>
                </div>
            )}

            {localStatus && !modelReady && (
                <div role="status" className="alert alertLoading">
                    <span className="spinner" />
                    {localStatus}
                </div>
            )}
        </>
    );
}
