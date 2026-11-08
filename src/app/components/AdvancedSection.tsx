import type { Method } from '../hooks/useAltText';
import type { OutputStyle } from '../lib/styleRules';
import MethodSelector from './MethodSelector';

interface Props {
    open: boolean;
    method: Method;
    localStatus: string;
    modelReady: boolean;
    modelCached: boolean;
    outputStyle: OutputStyle;
    onMethodChange: (m: Method) => void;
    onStyleChange: (s: OutputStyle) => void;
}

const STYLES: { value: OutputStyle; label: string; desc: string }[] = [
    { value: 'normal', label: 'Normal', desc: 'Concise and accurate' },
    { value: 'short', label: 'Short', desc: '3–6 words' },
    { value: 'casual', label: 'Casual', desc: 'Friendly, conversational' },
    { value: 'detailed', label: 'Detailed', desc: 'Colors, context, composition' },
    { value: 'creative', label: 'Creative', desc: 'Vivid, mood-driven' },
];

export default function AdvancedSection({
    open, method, localStatus, modelReady, modelCached, outputStyle, onMethodChange, onStyleChange,
}: Props) {
    return (
        <div className="advanced">
            <div className={`advancedBody${open ? ' advancedBodyOpen' : ''}`} aria-hidden={!open}>
                <div className="advancedInner" inert={!open}>
                    <div className="advancedContent">
                        <MethodSelector
                            method={method}
                            localStatus={localStatus}
                            modelReady={modelReady}
                            modelCached={modelCached}
                            onChange={onMethodChange}
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
                </div>
            </div>
        </div>
    );
}
