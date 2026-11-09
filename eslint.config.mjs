import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // These UI effects intentionally stage content and reveal state across animation frames.
            'react-hooks/set-state-in-effect': 'off',
            // ResultBox retains the previous content in a ref while its closing animation completes.
            'react-hooks/refs': 'off',
        },
    },
    globalIgnores([
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
    ]),
]);
