# ImgAlt — image alt text generator

A **Next.js** app that drafts accessible image alt text from an uploaded image or image URL. Review the description before publishing it.

Choose an OpenAI API model or a pair of local browser models, then select the output style.

## Features

- Upload `.jpg`, `.jpeg`, `.png`, or `.webp` images
- Paste an image **URL**; the app server retrieves the image before generation
- Auto-generates on upload or URL submit — no button needed
- Two generation methods:
  - **API mode** — requests OpenAI GPT-6 Luna through the app server (requires `OPENAI_API_KEY`)
  - **Local mode** — downloads `Xenova/vit-gpt2-image-captioning` and `Xenova/flan-t5-small` from HuggingFace.co and runs them in the browser through Transformers.js; estimated combined download ~345 MB, cached in the browser
- Output style selector — Normal, Short, Detailed, or Creative
- Model cache detection — skips confirmation and download spinner on repeat visits
- Server-side rate limiting (10 API calls per hour)
- One-click copy to clipboard
- Responsive design with a light/dark switch

## How it works

1. Pick a generation method from the Advanced panel
2. Upload an image or paste an image URL
3. Alt text is generated automatically
4. Copy the result with one click

## Tech stack

| Technology                | Purpose                                           |
|---------------------------|---------------------------------------------------|
| **Next.js 16**            | Full-stack React framework (App Router)           |
| **OpenAI GPT-6 Luna**     | API image-to-text request                          |
| **Transformers.js**       | In-browser captioning and rephrasing (local mode) |
| **TypeScript**            | Type safety across app and API routes             |
| **Tailwind CSS**          | Utility-first styling                             |


## Demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)

## Privacy

Uploaded images are read in the browser. API mode sends the image through the app server to OpenAI. An image URL is sent to the app server, which fetches the image from its host. Local mode downloads the two models from HuggingFace.co into browser cache and runs inference in the browser. The theme preference is stored in browser local storage. The app adds no analytics cookies; hosting and third-party services may maintain their own request logs. See the app's `/info` page for the full notice.

## Copyright and license

© 2026 devieffe. The app source is licensed under the [MIT License](./LICENSE). Model files and external services have separate terms.

