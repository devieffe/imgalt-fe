import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Sliding-window call timestamps (resets on server restart)
const callLog: number[] = [];

function checkRateLimit(): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  // Drop timestamps outside the window
  while (callLog.length > 0 && callLog[0] < windowStart) callLog.shift();
  if (callLog.length >= RATE_LIMIT) {
    const retryAfterSec = Math.ceil((callLog[0] + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSec };
  }
  callLog.push(now);
  return { allowed: true, retryAfterSec: 0 };
}

export async function POST(req: Request) {
  const { allowed, retryAfterSec } = checkRateLimit();
  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limit reached (${RATE_LIMIT} API calls per hour). Try again in ${Math.ceil(retryAfterSec / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    );
  }

  try {
    const { imageBase64 } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image for an alt attribute in HTML, in plain text, be concise and specific.',
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
      max_tokens: 100,
    });

    const altText = response.choices[0]?.message?.content ?? 'No description generated.';
    return NextResponse.json({ alt: altText });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Image processing failed.' }, { status: 500 });
  }
}