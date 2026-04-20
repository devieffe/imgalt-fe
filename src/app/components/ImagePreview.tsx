import Image from 'next/image';

interface Props {
    src: string;
}

export default function ImagePreview({ src }: Props) {
    if (!src) return null;
    return (
        <div className="preview">
            <Image
                src={src}
                alt="Preview"
                unoptimized
                width={0}
                height={0}
                sizes="100vw"
                className="previewImg"
            />
        </div>
    );
}
