# ImgAlte FE

This is a web app built with **Next.js** that allows users to upload images or provide image URLs and receive **generated img alt text descriptions** 
using OpenAI's image model. It's perfect for improving accessibility and better search optimization practices in image-heavy websites.

## ✅ Features

- Upload `.jpg`, `.jpeg`, or `.png` images
- Add image by **URL**
- Generate descriptive **alt text** automatically via OpenAI API
- Preview image and description
# - Limits requests to **5 per IP every 2 hours**
- Support for **Edge Functions** and modern **Next.js App Router**

## How It Works

1. User uploads an image or pastes an image URL
2. Image is validated and converted to base64 (for uploads)
3. Sent to OpenAI API 4o for image understanding
4. A meaningful, accurate alt description is returned and displayed

## Tech stack

| Technology    | Purpose                               |
|---------------|----------------------------------------|
| **Next.js 15**| Full-stack React framework             |
| **OpenAI API**| Generates summaries from scraped links |
| **TypeScript**| Type safety across app and backend     |
| **SCSS**      | Custom style UI                        |


## 📸 Demo

[imgalt-fe.vercel.app](https://imgalt-fe.vercel.app/)
  
