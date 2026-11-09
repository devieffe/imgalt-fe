import { NextResponse } from 'next/server';
import { API_PROMPTS } from '../../lib/styleRules';
import { API_MODEL } from '../../lib/modelInfo';

export const runtime = 'nodejs';

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_IMAGE_DATA_URL_LENGTH = 8 * 1024 * 1024;
const ALLOWED_IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

// In-memory only; use a shared store for rate limiting across serverless instances.
const callLog = new Map<string, number[]>();

function getClientKey(req: Request): string {
  // Only trust the platform-provided address header when explicitly configured.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const address = header ? req.headers.get(header)?.split(',')[0]?.trim() : undefined;
  return address || 'anonymous';
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = (callLog.get(key) ?? []).filter(timestamp => timestamp >= windowStart);
  if (recent.length >= RATE_LIMIT) {
    const retryAfterSec = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    callLog.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  callLog.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  try {
    if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415 });
    }

    const contentLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json({ error: 'Image is too large. Choose an image under 6 MB.' }, { status: 413 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { imageBase64, outputStyle } = body as { imageBase64?: unknown; outputStyle?: unknown };
    if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_DATA_URL_LENGTH || !ALLOWED_IMAGE_DATA_URL.test(imageBase64)) {
      return NextResponse.json({ error: 'Provide a valid JPEG, PNG, or WebP image under 6 MB.' }, { status: 400 });
    }
    if (outputStyle !== undefined && (typeof outputStyle !== 'string' || !(outputStyle in API_PROMPTS))) {
      return NextResponse.json({ error: 'Unsupported output style.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Alt-text generation is not configured.' }, { status: 503 });
    }

    const { allowed, retryAfterSec } = checkRateLimit(getClientKey(req));
    if (!allowed) {
      return NextResponse.json(
        { error: `Rate limit reached (${RATE_LIMIT} API calls per hour). Try again in ${Math.ceil(retryAfterSec / 60)} min.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });
    const prompt = API_PROMPTS[outputStyle as keyof typeof API_PROMPTS] ?? API_PROMPTS.normal;

    const response = await openai.chat.completions.create({
      model: API_MODEL.id,
      reasoning_effort: 'none',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
              url: imageBase64,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 150,
    });

    const altText = response.choices[0]?.message?.content ?? 'No description generated.';
    return NextResponse.json({ alt: altText });
  } catch (error) {
    console.error('Alt-text generation failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Image processing failed.' }, { status: 500 });
  }
}
