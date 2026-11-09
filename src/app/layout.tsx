import type { Metadata } from "next";
import { API_MODEL, LOCAL_MODELS } from './lib/modelInfo';
import './globals.css';

export const metadata: Metadata = {
  title: 'ImgAlt',
  description: 'Create accessible image descriptions from uploaded files or image URLs with an OpenAI API model or local browser models. Choose normal, short, detailed, or creative alt text.',
  applicationName: "ImgAlt",
  keywords: ['alt text', 'image descriptions', 'image accessibility', 'AI alt text'],
  authors: [{ name: "devieffe", url: "https://github.com/devieffe/imgalt-fe" }],
  other: {
    copyright: '© 2026 devieffe',
    license: 'MIT',
    source: 'https://github.com/devieffe/imgalt-fe',
    'api-model': API_MODEL.id,
    'local-models': `${LOCAL_MODELS.caption.id}, ${LOCAL_MODELS.rephrase.id}`,
    'privacy-notice': '/info#privacy',
  },
  referrer: "strict-origin-when-cross-origin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skipLink" href="#main-content">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
