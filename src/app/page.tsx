'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [altText, setAltText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setHydrated(true), []);

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
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setAltText('');
    setCopied(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
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

    if (!ALLOWED_EXTENSIONS.test(parsedUrl.pathname)) {
      setError('Only image URLs ending in .jpg, .jpeg, or .png are allowed.');
      return;
    }

    try {
      const img = new window.Image();

      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });

      img.src = urlString;
      await loadPromise;

      setImageSrc(urlString);
      generateAltText(urlString);
    } catch {
      setError("The image URL doesn't exist or cannot be loaded.");
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard.');
    }
  };

  if (!hydrated) return null;

  const isUrlReady = imageUrlInput.trim().length > 0;

  return (
    <div className="wrapper">
      <div className="card">
        <div className="header">
          <h1 className="title">Generate alt text</h1>
          <p className="subtitle">Instantly get accessible alt text for web images using AI.</p>
        </div>

        <div className="form">
          {/* URL input row */}
          <div className="urlRow">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Paste image URL (.jpg, .jpeg, .png)"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="input"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!isUrlReady}
              className="btnPrimary"
            >
              Add URL
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <div className="dividerLine" />
            or
            <div className="dividerLine" />
          </div>

          {/* Upload button */}
          <label className="uploadLabel">
            <input type="file" accept=".jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
            <div className="uploadBtn">
              <span className="material-icons">upload_file</span>
              Upload file
            </div>
          </label>

          {/* Error alert */}
          {error && (
            <div role="alert" className="alert alertError">
              <span className="material-icons alertErrorIcon">warning</span>
              <span>{error}</span>
              <button onClick={() => setError('')} className="alertErrorDismiss" aria-label="Dismiss error">
                <span className="material-icons">close</span>
              </button>
            </div>
          )}

          {/* Image preview */}
          {imageSrc && (
            <div className="preview">
              <Image
                src={imageSrc}
                alt="Preview"
                unoptimized
                width={0}
                height={0}
                sizes="100vw"
                className="previewImg"
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div role="status" className="alert alertLoading">
              <span className="spinner" />
              Generating alt text…
            </div>
          )}

          {/* Result */}
          {!loading && altText && (
            <div className="alert alertSuccess">
              <div className="alertSuccessHeader">
                <span className="material-icons">check_circle</span>
                <span>Alt text generated</span>
                <button
                  onClick={handleCopy}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                  aria-label="Copy alt text"
                  className="copyBtn"
                  data-copied={copied}
                >
                  <span className="material-icons">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="altText">{altText}</p>
            </div>
          )}

          {/* Copy toast */}
          {copied && (
            <div role="status" className="toast">
              <span className="material-icons">check</span>
              Copied to clipboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
}