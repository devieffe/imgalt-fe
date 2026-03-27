'use client';

import React, { useState, useEffect } from 'react';

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setHydrated(true), []);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedExtensions = /\.(jpg|jpeg|png)$/i;

  const generateAltText = async (src: string) => {
    setAltText('');
    setError('');
    setCopied(false);
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
    setCopied(false);

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
    setCopied(false);

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(urlString);
    } catch {
      setError('Enter a valid image URL.');
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
      setError('The image URL doesn\'t exist or cannot be loaded.');
    }
  };

  const handleUrlSubmit = async () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    await validateAndLoadImageUrl(trimmed);
  };

  const handleCopy = async () => {
    if (!altText) return;

    try {
      await navigator.clipboard.writeText(altText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError('Failed to copy alt text.');
    }
  };

  if (!hydrated) return null;

  const inputClass =
    'w-full min-w-0 rounded border border-[#ddd] px-4 py-2';

  const baseButton =
    'bg-black text-white font-semibold rounded text-center w-full border border-white px-4 py-2';

  const panelClass =
    'border border-[#ddd] rounded shadow-sm p-4 relative';

  const isUrlReady = imageUrlInput.trim().length > 0;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-3">Generate alt text</h1>

      <div className="space-y-3">
        {/* URL */}
        <div className="grid grid-cols-[1fr_128px] gap-3">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Paste image URL"
            className={inputClass}
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

        {/* Upload */}
        <label className="block">
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleUpload}
            className="hidden"
          />
          <div className={`${baseButton} cursor-pointer text-center`}>
            Upload file
          </div>
        </label>

        {/* Error */}
        {error && <div className={panelClass}>{error}</div>}

        {/* Image */}
        {imageSrc && (
          <div className={panelClass}>
            <img src={imageSrc} alt="Preview" className="max-h-[400px] mx-auto" />
          </div>
        )}

        {/* Loading / Result */}
        {loading ? (
          <div className={panelClass}>Generating alt...</div>
        ) : (
          altText && (
            <div className={`${panelClass} pr-[69px]`}>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 text-xl cursor-pointer"
                aria-label="Copy alt text"
                title={copied ? 'Copied' : 'Copy alt text'}
                type="button"
              >
                {copied ? '✓' : '⧉'}
              </button>

              <p>{altText}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}