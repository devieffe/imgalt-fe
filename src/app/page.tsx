'use client';

import { useState } from 'react';

export default function Home() {
  const [imageSrc, setImageSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are supported.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImageSrc(base64);
      await generateAltText(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = async () => {
    if (!imageUrlInput) return;

    const isValidImage = imageUrlInput.match(/\.(jpg|jpeg|png)$/i);
    if (!isValidImage) {
      setError('Only image URLs ending in .jpg, .jpeg, or .png are allowed.');
      return;
    }

    setError('');
    setImageSrc(imageUrlInput);
    await generateAltText(imageUrlInput);
  };

  const generateAltText = async (src: string) => {
    setLoading(true);
    setAltText('');

    try {
      const res = await fetch('/api/imgalt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: src }),
      });

      const data = await res.json();
      if (res.ok) {
        setAltText(data.alt || 'No alt generated.');
      } else {
        setError(data.error || 'Failed to generate alt text.');
      }
    } catch (err) {
      setError('Something went wrong.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold mb-6">AI Alt Text Generator</h1>

      <div className="space-y-4 mb-6 w-full max-w-md">
        <div>
          <input type="file" accept=".jpg,.jpeg,.png" onChange={handleUpload} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste image URL (.jpg, .jpeg, .png)"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            className="border px-3 py-1 rounded w-full"
          />
          <button
            onClick={handleUrlSubmit}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Load
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}
      </div>

      {imageSrc && (
        <img
          src={imageSrc}
          alt=""
          className="my-4 max-h-64 border rounded shadow"
        />
      )}

      {loading ? (
        <p className="text-gray-600 italic">Generating alt text...</p>
      ) : (
        altText && <p className="mt-2 font-medium">Alt: {altText}</p>
      )}
    </main>
  );
}