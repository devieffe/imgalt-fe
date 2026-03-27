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
  const allowedExtensions = /\.(jpg|jpeg|png)$/i;

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

    setError('');
    setAltText('');

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

  const validateAndLoadImageUrl = async (urlString: string) => {
    setError('');
    setAltText('');

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(urlString);
    } catch {
      setError('Please enter a valid image URL.');
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('Only http and https image URLs are allowed.');
      return;
    }

    if (!allowedExtensions.test(parsedUrl.pathname)) {
      setError('Only image URLs ending in .jpg, .jpeg, or .png are allowed.');
      return;
    }

    try {
      const img = new Image();

      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });

      img.src = urlString;
      await loadPromise;

      setImageSrc(urlString);
      generateAltText(urlString);
    } catch {
      setError('The image URL does not exist, cannot be loaded, or is blocked.');
    }
  };

  const handleUrlSubmit = async () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    await validateAndLoadImageUrl(trimmed);
  };

  if (!hydrated) return null;

  const baseButton =
    'bg-black text-white font-semibold px-4 py-2 rounded text-center w-full border-2 border-white';

  const panelClass = 'px-4 py-2 rounded border shadow-sm overflow-hidden';

  const isUrlReady = imageUrlInput.trim().length > 0;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Generate alt text</h1>

      <div className="space-y-3">
        {/* URL input + button */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_128px] gap-3 w-full">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Paste image URL (.jpg, .jpeg, .png)"
            className="w-full border rounded px-4 py-2 min-w-0"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />

          <button
            onClick={handleUrlSubmit}
            disabled={!isUrlReady}
            className={`${baseButton} ${isUrlReady
                ? 'cursor-pointer opacity-100'
                : 'cursor-not-allowed opacity-80'
              }`}
          >
            Add URL
          </button>
        </div>

        {/* File upload */}
        <div className="w-full">
          <label className="block w-full">
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleUpload}
              className="hidden"
            />
            <p className={`${baseButton} cursor-pointer`}>
              Upload a file
            </p>
          </label>
        </div>

        {/* Error */}
        {error && <div className={panelClass}>{error}</div>}

        {/* Image preview */}
        {imageSrc && (
          <div className={panelClass}>
            <img
              src={imageSrc}
              alt="Image"
              className="max-h-[400px] mx-auto"
            />
          </div>
        )}

        {/* Loading / Alt text */}
        {loading ? (
          <div className={panelClass}>Generating alt ...</div>
        ) : (
          altText && (
            <div className={panelClass}>
              <p>{altText}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}