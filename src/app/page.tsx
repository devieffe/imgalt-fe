'use client';

import { useEffect, useState } from 'react';
import { useAltText } from './hooks/useAltText';
import AdvancedSection from './components/AdvancedSection';
import ImageInput from './components/ImageInput';
import ResultBox from './components/ResultBox';
import RevealPanel from './components/RevealPanel';
import Message from './components/Message';
import Icon from './components/Icon';
import Subtitle from './components/Subtitle';
import { usePanel } from './hooks/usePanel';

export default function AltTextGenerator() {
  const [hydrated, setHydrated] = useState(false);
  const [loadedImageVersion, setLoadedImageVersion] = useState(-1);
  const [alertVisible, setAlertVisible] = useState(false);
  const { isOpen: appOpen, openPanel: openAppPanel } = usePanel();
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated) openAppPanel();
  }, [hydrated, openAppPanel]);

  const urlPanel = usePanel();
  const advancedPanel = usePanel();

  const {
    imageSrc,
    imageVersion,
    imageUploadVersion,
    handlePreviewLoaded,
    imageUrlInput, setImageUrlInput,
    altText,
    error, setError,
    urlError, setUrlError,
    loading,
    imageValidated,
    copied,
    method, changeMethod, prepareLocalModel,
    outputStyle, setOutputStyle,
    localStatus, modelReady, modelCached, modelCachePresent, modelWorking, apiWorking, downloadProgress, downloadedBytes, downloadTotalBytes,
    deleteLocalModel, deletingModel,
    cancelLocalModelSetup,
    handleUpload, removeImage,
    handleUrlSubmit,
    handleCopy,
  } = useAltText();

  if (!hydrated) return null;

  return (
    <div className="flex min-h-svh items-start justify-center px-4 py-14 max-[540px]:px-3 max-[540px]:py-5 max-[360px]:px-2">
      <RevealPanel className="appBoxReveal" open={appOpen}>
      <main className="box-border w-full max-w-[35rem] rounded-3xl bg-[var(--surface)] px-[calc(2.35rem+2px)] pt-[calc(2.35rem-12px)] pb-[calc(2.35rem-19px)] max-[540px]:max-w-full max-[540px]:rounded-xl max-[540px]:px-[18px] max-[540px]:py-[12px] max-[360px]:px-[14px]" id="main-content">
        <div className="titleHeader mb-7">
          <h1 className="title">alt</h1>
          <Subtitle />
        </div>

        <div className="flex flex-col gap-5">
          <section className="uploadGroup" aria-label="Image input and settings">
            <ImageInput
              urlOpen={urlPanel.isOpen}
              urlError={urlError}
              value={imageUrlInput}
              onChange={setImageUrlInput}
              onUrlErrorDismiss={() => setUrlError('')}
              onSubmit={handleUrlSubmit}
              imageSrc={imageSrc}
              imageVersion={imageVersion}
              onPreviewLoad={(src) => {
                setLoadedImageVersion(imageVersion);
                handlePreviewLoaded(src);
              }}
              onUpload={handleUpload}
              onRemove={removeImage}
            >
              <Message message={!imageSrc || loadedImageVersion === imageVersion ? error : ''} onDismiss={() => setError('')} keepUntilClosed timerResetKey={imageUploadVersion} onVisibilityChange={setAlertVisible} />
              <ResultBox
                loading={loading}
                imageValidated={imageValidated}
                altText={altText}
                error={error || urlError}
                blocked={alertVisible}
                retainWhileUploading={Boolean(imageSrc) && !imageValidated}
                copied={copied}
                onCopy={handleCopy}
              />
            </ImageInput>

            <div className="controlsRow">
              <button className="controlLink" type="button" aria-expanded={advancedPanel.isOpen} aria-controls="advanced-settings" onClick={advancedPanel.togglePanel}>
                <span className="controlLinkContent">
                  Advanced
                  <Icon name={advancedPanel.isOpen ? 'chevronUp' : 'chevronDown'} className="controlLinkIcon" />
                </span>
              </button>
              <button className="controlLink" type="button" aria-expanded={urlPanel.isOpen} aria-controls="image-url-form" onClick={urlPanel.togglePanel}>
                <span className="controlLinkContent">
                  <Icon name={urlPanel.isOpen ? 'minus' : 'plus'} className="controlLinkIcon" />
                  Add URL
                </span>
              </button>
            </div>
          </section>

          <div id="advanced-settings">
          <AdvancedSection
            open={advancedPanel.isOpen}
            method={method}
            localStatus={localStatus}
            modelReady={modelReady}
            modelCached={modelCached}
            modelCachePresent={modelCachePresent}
            modelWorking={modelWorking}
            apiWorking={apiWorking}
            downloadProgress={downloadProgress}
            downloadedBytes={downloadedBytes}
            downloadTotalBytes={downloadTotalBytes}
            outputStyle={outputStyle}
            onMethodChange={changeMethod}
            onPrepareLocalModel={prepareLocalModel}
            onDeleteLocalModel={deleteLocalModel}
            onCancelLocalModelSetup={cancelLocalModelSetup}
            deleteDisabled={deletingModel || loading || localStatus === 'downloading' || localStatus === 'Loading model into memory…'}
            onStyleChange={setOutputStyle}
          />
          </div>
        </div>
      </main>
      </RevealPanel>
    </div>
  );
}
