# ImgAlt

ImgAlt drafts accessible alt text for images. Upload a JPEG, PNG, or WebP image, or provide an image URL, then review and copy the suggested description. The app generates text descriptions; it does not generate or edit images.

Choose an OpenAI API model or run the local image captioning and rephrasing models in the browser. Output styles are Normal, Short, Detailed, and Creative.

## Features

- Image upload and public HTTP(S) image URL input
- Automatic alt-text generation after the image is validated
- OpenAI API and local browser inference methods
- Local model download progress, cache detection, and cache removal
- Responsive interface that follows the device or browser light/dark preference
- Copy generated text with one click
- Privacy, model, and license details at `/info`

## Models

| Method | Model | Details |
| --- | --- | --- |
| API | OpenAI GPT-6 Luna (`gpt-6-luna`) | Uses the app server and requires an `OPENAI_API_KEY`. |
| Local captioning | ViT-GPT2 (`Xenova/vit-gpt2-image-captioning`) | Runs in the browser through Transformers.js. |
| Local rephrasing | FLAN-T5 (`Xenova/flan-t5-small`) | Rephrases local captions to match the selected output style. |

The two local models download from HuggingFace.co (estimated combined size: 345 MB) and are stored in the browser cache. Local results may be less consistent than API results. Model files have their own licenses and terms.

## Run locally

Requirements: Node.js and npm.

```sh
npm install
```

For API mode, create `.env.local` in the project root and set your server-side key:

```dotenv
OPENAI_API_KEY=your_openai_api_key
```

Keep the key on the server; do not add it to client-side code or commit `.env.local`. Local mode can run without an OpenAI key.

Start the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Other commands

```sh
npm run lint
npm test
npm run build
npm start
```

`npm start` serves the production build created by `npm run build`.

## Input limits

- Uploads and fetched images must be JPEG, PNG, or WebP and smaller than 6 MB.
- Image URLs must use HTTP or HTTPS and point to a public host. The URL path must end in `.jpg`, `.jpeg`, `.png`, or `.webp`; query parameters are supported.
- Images larger than 40 million pixels are rejected by the browser-side validation.

## Privacy and API limits

- In API mode, image data is sent to the ImgAlt server and then to OpenAI for description generation.
- For URL input, the ImgAlt server fetches the image from its public host. In local mode, the selected image stays in the browser while model files are downloaded from HuggingFace.co and inference runs in the browser.
- The app does not add analytics cookies. The theme preference is stored in browser local storage. Hosting providers and external services may keep request logs under their own privacy policies.
- API requests are limited to 10 per hour per in-memory server key. By default, requests share an anonymous key; deployments can set `TRUSTED_CLIENT_IP_HEADER` only when their platform supplies a trusted client-address header. The in-memory limit is per server process and is not shared across serverless instances.

The app's `/info` page contains the in-app privacy notice, model details, copyright, and license information.

## Demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)

## License

© 2026 devieffe. The app source is licensed under the [MIT License](./LICENSE). Model weights and third-party services are subject to their respective licenses and terms.
