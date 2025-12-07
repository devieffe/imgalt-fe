'use client';

import React, { useState, useEffect } from 'react';

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => setHydrated(true), []);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  const generateAltText = async (src: string) => {
    setAltText('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/imgalt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: src }),
      });
      const data = await res.json();
      if (res.ok) setAltText(data.alt || 'No alt text generated.');
      else setError(data.error || 'Failed to generate alt text.');
    } catch {
      setError('Something went wrong.');
    }
    setLoading(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError('Only .jpg, .jpeg, and .png files are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageSrc(base64);
      generateAltText(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!imageUrlInput.trim()) return;
    if (!imageUrlInput.match(/\.(jpg|jpeg|png)$/i)) {
      setError('Only image URLs ending in .jpg, .jpeg, or .png are allowed.');
      return;
    }
    setImageSrc(imageUrlInput);
    generateAltText(imageUrlInput);
  };

  if (!hydrated) return null;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Generate alt text</h1>

      {/* URL input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          placeholder="Paste image URL (.jpg, .jpeg, .png)"
          className="flex-1 border rounded p-2"
          onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
        />
        <button
          onClick={handleUrlSubmit}
          className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-4 py-2 rounded w-32 flex-shrink-0"
        >
          Add URL
        </button>
      </div>

      {/* File upload */}
      <div>
        <label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleUpload}
            className="hidden"
          />
          <p className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-full text-center cursor-pointer">
            Upload a file
          </p>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded border shadow-sm overflow-hidden">
          {error}
        </div>
      )}

      {/* Image preview */}
      {imageSrc && (
        <div className="mt-4 p-4 rounded border shadow-sm overflow-hidden max-h-400px">
          <img src={imageSrc} alt="Image" className="max-h-400px mx-auto" />
        </div>
      )}

      {/* Loading / Alt text */}
      {loading ? (
        <div className="mt-4 p-4 rounded border shadow-sm overflow-hidden">
          Generating alt ...
        </div>
      ) : (
        altText && (
          <div className="mt-4 p-4 rounded border shadow-sm overflow-hidden">
            <p>{altText}</p>
          </div>
        )
      )}
    </div>
  );
}