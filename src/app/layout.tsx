import type { Metadata } from "next";
import './globals.css';

export const metadata: Metadata = {
  title: "Generate alt text for images",
  description: "Generate accessible alt text for images.",
  applicationName: "ImgAlt",
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
