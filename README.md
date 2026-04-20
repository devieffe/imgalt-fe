# Imgalt - AI Alt Text Generator

A **Next.js** app that generates descriptive `alt` text for images — improving web accessibility and SEO for image-heavy sites.

Upload an image or paste a URL and get an accurate alt text description in seconds, either via the OpenAI API or entirely in-browser using a local AI model.

## ✨ Features

- Upload `.jpg`, `.jpeg`, `.png`, or `.webp` images
- Paste an image **URL** to generate alt text without uploading
- Auto-generates on upload or URL submit — no button needed
- Two generation methods:
  - **API mode** — uses OpenAI GPT-4o (requires API key)
  - **Local mode** — runs fully in the browser via [Transformers.js](https://huggingface.co/docs/transformers.js); no API key needed; model is downloaded once (~150 MB) and cached
- Output style selector — Normal, Casual, Detailed, or Creative (API mode)
- Model cache detection — skips confirmation and download spinner on repeat visits
- Server-side rate limiting (10 API calls per hour)
- One-click copy to clipboard
- Responsive design with dark mode support

## 🔄 How it works

1. Pick a generation method from the Advanced panel
2. Upload an image or paste an image URL
3. Alt text is generated automatically
4. Copy the result with one click

## 🛠 Tech stack

| Technology                | Purpose                                           |
|---------------------------|---------------------------------------------------|
| **Next.js 16**            | Full-stack React framework (App Router)           |
| **OpenAI GPT-4o**         | Cloud-based image-to-text (API mode)              |
| **Transformers.js**       | In-browser ML inference (local mode, no API key)  |
| **TypeScript**            | Type safety across app and API routes             |
| **Tailwind CSS**          | Utility-first styling                             |


## 🌐 Live demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)

