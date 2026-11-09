// Keep the names and download estimates shown to users in sync with inference.
export const API_MODEL = {
    id: 'gpt-6-luna',
    label: 'GPT-6 Luna',
} as const;

export const LOCAL_MODELS = {
    caption: {
        id: 'Xenova/vit-gpt2-image-captioning',
        label: 'ViT-GPT2',
        estimatedBytes: 250_000_000,
    },
    rephrase: {
        id: 'Xenova/flan-t5-small',
        label: 'FLAN-T5',
        estimatedBytes: 95_000_000,
    },
} as const;

export const LOCAL_DOWNLOAD_ESTIMATE_MB = Math.round(
    (LOCAL_MODELS.caption.estimatedBytes + LOCAL_MODELS.rephrase.estimatedBytes) / 1_000_000,
);
