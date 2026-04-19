import type { Metadata } from "next";
import './globals.css';

export const metadata: Metadata = {
  title: "Generate alt text for images",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
