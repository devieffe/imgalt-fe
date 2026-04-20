interface Props {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ImageInput({ value, onChange, onSubmit, onUpload }: Props) {
    const isReady = value.trim().length > 0;

    return (
        <>
            <label className="methodLabel">Image</label>

            <label className="uploadLabel">
                <input type="file" accept=".jpg,.jpeg,.png" onChange={onUpload} className="hidden" />
                <div className="uploadBtn">
                    <span className="material-icons">upload_file</span>
                    Upload file
                </div>
            </label>

            <div className="divider">
                <div className="dividerLine" />
                or
                <div className="dividerLine" />
            </div>

            <div className="urlRow">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste image URL (.jpg, .jpeg, .png)"
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    className="input"
                />
                <button onClick={onSubmit} disabled={!isReady} className="btnPrimary">
                    Add URL
                </button>
            </div>
        </>
    );
}
