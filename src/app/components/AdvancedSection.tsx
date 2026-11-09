import type { Method } from '../hooks/useAltText';
import type { OutputStyle } from '../lib/styleRules';
import MethodSelector from './MethodSelector';
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
    outputStyle: OutputStyle;
    onMethodChange: (m: Method) => void;
    onPrepareLocalModel: () => void;
    onDeleteLocalModel: () => void;
    onCancelLocalModelSetup: () => void;
    deleteDisabled: boolean;
    onStyleChange: (s: OutputStyle) => void;
}

const STYLES: { value: OutputStyle; label: string; desc: string }[] = [
    { value: 'normal', label: 'Normal', desc: 'Concise and accurate' },
    { value: 'short', label: 'Short', desc: '3–6 words' },
    { value: 'detailed', label: 'Detailed', desc: 'Colors, context, composition' },
    { value: 'creative', label: 'Creative', desc: 'Vivid, mood-driven' },
];

export default function AdvancedSection({
    open, method, localStatus, modelReady, modelCached, modelCachePresent, modelWorking, apiWorking, downloadProgress, downloadedBytes, downloadTotalBytes, outputStyle, onMethodChange, onPrepareLocalModel, onDeleteLocalModel, onCancelLocalModelSetup, deleteDisabled, onStyleChange,
}: Props) {
    return (
        <div className="advanced">
            <RevealPanel open={open}>
                    <div className="advancedContent">
                        <MethodSelector
                            open={open}
                            method={method}
                            localStatus={localStatus}
                            modelReady={modelReady}
                            modelCached={modelCached}
                            modelCachePresent={modelCachePresent}
                            modelWorking={modelWorking}
                            apiWorking={apiWorking}
                            downloadProgress={downloadProgress}
                            downloadedBytes={downloadedBytes}
                            downloadTotalBytes={downloadTotalBytes}
                            onChange={onMethodChange}
                            onPrepareLocalModel={onPrepareLocalModel}
                            onDeleteLocalModel={onDeleteLocalModel}
                            onCancelLocalModelSetup={onCancelLocalModelSetup}
                            deleteDisabled={deleteDisabled}
                        />

                        <div className="styleRow">
                            <span className="methodLabel">Output style</span>
                            <div className="stylePills">
                                {STYLES.map(s => (
                                    <button
                                        key={s.value}
                                        className={`stylePill${outputStyle === s.value ? ' stylePillActive' : ''}`}
                                        onClick={() => onStyleChange(s.value)}
                                        title={s.desc}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
            </RevealPanel>
        </div>
    );
}
