'use client';

import { useEffect, useState } from 'react';
import { useAltText } from './hooks/useAltText';
import AdvancedSection from './components/AdvancedSection';
import ImageInput from './components/ImageInput';
import ImagePreview from './components/ImagePreview';
import ResultBox from './components/ResultBox';

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [urlOpen, setUrlOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    imageSrc,
    imageUrlInput, setImageUrlInput,
    altText,
    error, setError,
    urlError,
    loading,
    copied,
    method, changeMethod,
    outputStyle, setOutputStyle,
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

          <div className="uploadGroup">
            <ImageInput
              urlOpen={urlOpen}
              urlError={urlError}
              value={imageUrlInput}
              onChange={setImageUrlInput}
              onSubmit={handleUrlSubmit}
              onUpload={handleUpload}
            />

            <div className="controlsRow">
              <button className="controlLink" onClick={() => setUrlOpen(o => !o)}>
                <span className="material-icons controlLinkIcon">{urlOpen ? 'remove' : 'add'}</span>
                Add URL
              </button>
              <button className="controlLink" onClick={() => setAdvancedOpen(o => !o)}>
                Advanced
                <span className="material-icons controlLinkIcon">{advancedOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>
          </div>

          <AdvancedSection
            open={advancedOpen}
            method={method}
            localStatus={localStatus}
            modelReady={modelReady}
            modelCached={modelCached}
            outputStyle={outputStyle}
            onMethodChange={changeMethod}
            onStyleChange={setOutputStyle}
          />
        </div>
      </div>
    </div>
  );
}
