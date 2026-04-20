export type OutputStyle = 'normal' | 'casual' | 'detailed' | 'creative';

// Prompts sent to GPT-4o (API method)
export const API_PROMPTS: Record<OutputStyle, string> = {
    normal:
        'Describe this image for an HTML alt attribute. Be factual, concise (one sentence), and specific. No introductory phrases.',
    casual:
        'Write a short, casual and friendly alt text for this image in one sentence, as if telling a friend what you see.',
    detailed:
        'Write a thorough alt text for this image covering subjects, colors, spatial composition, setting, and any visible text or actions. Two to three sentences.',
    creative:
        'Write a vivid, imaginative alt text for this image that captures its mood, atmosphere, and essence in one or two evocative sentences.',
};

// Rules applied to local model raw caption output
export type StyleRule = {
    /** Trim and normalise whitespace */
    normalise: boolean;
    /** Ensure the text ends with a full stop */
    ensurePeriod: boolean;
    /** Strip leading boilerplate phrases the model tends to emit */
    stripPreamble: boolean;
    /** Force sentence to start with a capital letter */
    capitalise: boolean;
    /** Append a style-specific suffix note (shown in parentheses) */
    suffix: string | null;
    /** Maximum character length — truncate at last word boundary */
    maxLength: number | null;
};

export const LOCAL_RULES: Record<OutputStyle, StyleRule> = {
    normal: {
        normalise: true,
        ensurePeriod: true,
        stripPreamble: true,
        capitalise: true,
        suffix: null,
        maxLength: 120,
    },
    casual: {
        normalise: true,
        ensurePeriod: false,
        stripPreamble: true,
        capitalise: true,
        suffix: null,
        maxLength: 100,
    },
    detailed: {
        normalise: true,
        ensurePeriod: true,
        stripPreamble: true,
        capitalise: true,
        suffix: null,
        maxLength: null,
    },
    creative: {
        normalise: true,
        ensurePeriod: true,
        stripPreamble: false,
        capitalise: true,
        suffix: null,
        maxLength: 160,
    },
};

// Boilerplate prefixes the vit-gpt2 model often prepends
const PREAMBLES = [
    /^a photo of\s+/i,
    /^an? image of\s+/i,
    /^this is\s+/i,
    /^picture of\s+/i,
    /^photograph of\s+/i,
];

export function applyStyleRules(raw: string, style: OutputStyle): string {
    const rule = LOCAL_RULES[style];
    let text = raw;

    if (rule.normalise) {
        text = text.trim().replace(/\s+/g, ' ');
    }

    if (rule.stripPreamble) {
        for (const re of PREAMBLES) {
            text = text.replace(re, '');
        }
        // Re-capitalise after stripping
        if (text.length > 0) {
            text = text[0].toUpperCase() + text.slice(1);
        }
    }

    if (rule.capitalise && text.length > 0) {
        text = text[0].toUpperCase() + text.slice(1);
    }

    if (rule.maxLength !== null && text.length > rule.maxLength) {
        // Truncate at last word boundary
        const cut = text.lastIndexOf(' ', rule.maxLength);
        text = cut > 0 ? text.slice(0, cut) : text.slice(0, rule.maxLength);
        text = text.replace(/[,;:\s]+$/, '');
    }

    if (rule.ensurePeriod && text.length > 0 && !/[.!?]$/.test(text)) {
        text = text + '.';
    }

    if (rule.suffix) {
        text = `${text} (${rule.suffix})`;
    }

    return text;
}
