'use client';

import { useEffect, useState } from 'react';
import { useAltText } from './hooks/useAltText';
import AdvancedSection from './components/AdvancedSection';
import ImageInput from './components/ImageInput';
import ImagePreview from './components/ImagePreview';
import ResultBox from './components/ResultBox';
import Icon from './components/Icon';

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
      <main className="card" id="main-content">
        <div className="header">
          <h1 className="title">Generate alt text</h1>
          <p className="subtitle">Instantly get accessible alt text for web images using AI.</p>
        </div>

        <div className="form">
          {error && (
            <div role="alert" className="alert alertError">
              <Icon name="warning" className="alertErrorIcon" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="alertErrorDismiss" aria-label="Dismiss error">
                <Icon name="close" />
              </button>
            </div>
          )}

          <ImagePreview src={imageSrc} />

          <ResultBox loading={loading} altText={altText} copied={copied} onCopy={handleCopy} />

          <section className="uploadGroup" aria-label="Image input and settings">
            <ImageInput
              urlOpen={urlOpen}
              urlError={urlError}
              value={imageUrlInput}
              onChange={setImageUrlInput}
              onSubmit={handleUrlSubmit}
              onUpload={handleUpload}
            />

            <div className="controlsRow">
              <button className="controlLink" type="button" aria-expanded={advancedOpen} aria-controls="advanced-settings" onClick={() => setAdvancedOpen(o => !o)}>
                <span className="controlLinkContent">
                  Advanced
                  <Icon name={advancedOpen ? 'chevronUp' : 'chevronDown'} className="controlLinkIcon" />
                </span>
              </button>
              <button className="controlLink" type="button" aria-expanded={urlOpen} aria-controls="image-url-form" onClick={() => setUrlOpen(o => !o)}>
                <span className="controlLinkContent">
                  <Icon name={urlOpen ? 'minus' : 'plus'} className="controlLinkIcon" />
                  Add URL
                </span>
              </button>
            </div>
          </section>

          <div id="advanced-settings">
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
      </main>
    </div>
  );
}
