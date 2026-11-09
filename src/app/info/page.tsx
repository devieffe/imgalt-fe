import { API_MODEL, LOCAL_MODELS, LOCAL_DOWNLOAD_ESTIMATE_MB } from '../lib/modelInfo';
import Link from 'next/link';

export const metadata = {
    title: 'About and privacy | ImgAlt',
    description: 'Models, licensing, copyright, and privacy information for ImgAlt.',
};

export default function InfoPage() {
    return (
        <main className="mx-auto min-h-svh w-full max-w-2xl px-5 py-12 text-[var(--fg)]">
            <Link className="text-sm text-[var(--muted)] hover:text-[var(--fg)]" href="/">Back to ImgAlt</Link>
            <h1 className="mt-6 text-3xl font-semibold">About ImgAlt</h1>
            <p className="mt-3 leading-7">ImgAlt creates accessible image descriptions from uploaded images or image URLs. Descriptions are suggestions; review them for accuracy and context before use.</p>

            <h2 className="mt-8 text-xl font-semibold">Models</h2>
            <p className="mt-3 leading-7">API mode sends images to the app server, which requests descriptions from {API_MODEL.label} ({API_MODEL.id}) using the operator’s OpenAI API key.</p>
            <p className="mt-3 leading-7">Local mode downloads {LOCAL_MODELS.caption.label} ({LOCAL_MODELS.caption.id}) for image captioning and {LOCAL_MODELS.rephrase.label} ({LOCAL_MODELS.rephrase.id}) for rephrasing through Transformers.js. The combined download is approximately {LOCAL_DOWNLOAD_ESTIMATE_MB} MB. Model files are stored in browser cache and inference runs in the browser. Local results may be less consistent than API results.</p>

            <h2 id="privacy" className="mt-8 text-xl font-semibold">Privacy</h2>
            <p className="mt-3 leading-7">Images are processed according to the selected method. In API mode, the image is sent through the app server to OpenAI. For image URLs, the app server retrieves the image from its host. In local mode, the image stays in the browser while model files are downloaded from HuggingFace.co and cached in the browser. The app does not add analytics cookies. Hosting providers and external services may keep request logs under their own privacy policies.</p>

            <h2 className="mt-8 text-xl font-semibold">Copyright and license</h2>
            <p className="mt-3 leading-7">© 2026 devieffe. The app source is licensed under the <a className="underline" href="https://opensource.org/license/mit">MIT License</a>. Model weights and third-party services are subject to their respective licenses and terms.</p>
        </main>
    );
}
