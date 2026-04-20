'use client';

import { useEffect, useState } from 'react';
import { useAltText } from './hooks/useAltText';
import MethodSelector from './components/MethodSelector';
import ImageInput from './components/ImageInput';
import ImagePreview from './components/ImagePreview';
import ResultBox from './components/ResultBox';

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const {
    imageSrc,
    imageUrlInput, setImageUrlInput,
    altText,
    error, setError,
    loading,
    copied,
    method, changeMethod,
    localStatus, modelReady, modelCached,
    handleUpload,
    handleUrlSubmit,
    handleCopy,
  } = useAltText();

  if (!hydrated) return null;

  return (
    <div className="wrapper">
      <div className="card">
        <div className="header">
          <h1 className="title">Generate alt text</h1>
          <p className="subtitle">Instantly get accessible alt text for web images using AI.</p>
        </div>

        <div className="form">
          <MethodSelector method={method} localStatus={localStatus} modelReady={modelReady} modelCached={modelCached} onChange={changeMethod} />

          <ImageInput
            value={imageUrlInput}
            onChange={setImageUrlInput}
            onSubmit={handleUrlSubmit}
            onUpload={handleUpload}
          />

          {error && (
            <div role="alert" className="alert alertError">
              <span className="material-icons alertErrorIcon">warning</span>
              <span>{error}</span>
              <button onClick={() => setError('')} className="alertErrorDismiss" aria-label="Dismiss error">
                <span className="material-icons">close</span>
              </button>
            </div>
          )}

          <ImagePreview src={imageSrc} />

          <ResultBox loading={loading} altText={altText} copied={copied} onCopy={handleCopy} />
        </div>
      </div>
    </div>
  );
}

