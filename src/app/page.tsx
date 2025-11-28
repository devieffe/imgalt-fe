'use client';

import { useState } from 'react';

export default function Home() {
  const [imageSrc, setImageSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setError('Only .jpg, .jpeg, and .png files are supported.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
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

  const generateAltText = async (src) => {
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
    <main className="min-h-screen p-6 flex flex-col items-center justify-start text-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Generate Alt Text for Images</h1>

      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-6 space-y-6 border border-gray-200">
        <div className="flex flex-col space-y-2">
          <label className="text-left text-sm font-medium text-gray-700">Upload an image</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleUpload}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer file:hover:bg-blue-700 text-gray-700"
          />
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Paste image URL (.jpg, .jpeg, .png)"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
          <button
            onClick={handleUrlSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Load
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      {imageSrc && (
        <img
          src={imageSrc}
          alt="Uploaded preview"
          className="my-6 max-h-72 rounded-xl shadow-md border"
        />
      )}

      {loading ? (
        <p className="text-gray-600 italic animate-pulse">Generating alt text...</p>
      ) : (
        altText && (
          <div className="mt-4 bg-white border rounded-xl shadow p-4 max-w-lg">
            <p className="text-gray-800 font-semibold text-left">Alt text:</p>
            <p className="text-gray-600 text-left mt-1">{altText}</p>
          </div>
        )
      )}
    </main>
  );
}