import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // ✅ NEW MODEL
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image for an alt attribute in HTML, be concise and specific.',
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

    const altText = response.choices[0]?.message?.content ?? 'No description generated';
    return NextResponse.json({ alt: altText });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Image processing failed.' }, { status: 500 });
  }
}