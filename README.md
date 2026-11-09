# ImgAlt

ImgAlt drafts alt text for images. Upload a JPEG, PNG, or WebP image, or provide an image URL, then review and copy the suggested description. The app generates text descriptions; it does not generate or edit images.

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

## Demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)

## License

© 2026 devieffe. The app source is licensed under the [MIT License](./LICENSE). Model weights and third-party services are subject to their respective licenses and terms.
