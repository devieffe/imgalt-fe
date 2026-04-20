# imgalt-fe

A **Next.js** app that generates descriptive `alt` text for images — improving web accessibility and SEO for image-heavy sites.

Upload an image or paste a URL and get an accurate alt text description in seconds, either via the OpenAI API or entirely in-browser using a local AI model.

## Features

- Upload `.jpg`, `.jpeg`, or `.png` images
- Paste an image **URL** to generate alt text without uploading
- Two generation methods:
  - **API mode** — uses OpenAI GPT-4o (requires API key)
  - **Local mode** — runs fully in the browser via [Transformers.js](https://huggingface.co/docs/transformers.js); no API key needed; model is downloaded once (~150 MB) and cached
- Model cache detection — skips confirmation and download spinner on repeat visits
- Server-side rate limiting (10 API calls per hour)
- One-click copy to clipboard
- Responsive design, dark mode support

## How it works

1. Pick a generation method from the dropdown
2. Upload an image or paste an image URL
3. The image is validated and sent for processing
4. A concise, accurate alt text is returned and displayed

## Tech stack

| Technology                | Purpose                                           |
|---------------------------|---------------------------------------------------|
| **Next.js 16**            | Full-stack React framework (App Router)           |
| **OpenAI GPT-4o**         | Cloud-based image-to-text (API mode)              |
| **Transformers.js**       | In-browser ML inference (local mode, no API key)  |
| **TypeScript**            | Type safety across app and API routes             |
| **Tailwind CSS**          | Utility-first styling                             |

## Environment

Create a `.env.local` file for API mode:

```env
OPENAI_API_KEY=your_key_here
```

Local mode works without any environment variables.


## Live demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)
  
