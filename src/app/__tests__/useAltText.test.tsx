import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAltText } from '../hooks/useAltText';

const mocks = vi.hoisted(() => ({
    cached: true,
    loadModel: vi.fn(),
    deleteCachedModel: vi.fn(async () => 1),
}));
vi.mock('../lib/localInference', () => ({
    isModelCached: async () => mocks.cached,
    hasModelCache: async () => mocks.cached,
    getModelCacheUrls: async () => [],
    deleteCachedModel: mocks.deleteCachedModel,
}));
vi.mock('../lib/localModelClient', () => ({ loadLocalModel: mocks.loadModel }));

class MockReader {
    result = 'data:image/png;base64,abc';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsDataURL() { this.onload?.(); }
}
class MockImage {
    naturalWidth = 100;
    naturalHeight = 100;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_src: string) { queueMicrotask(() => this.onload?.()); }
}

beforeEach(() => {
    mocks.cached = true;
    mocks.loadModel.mockReset();
    mocks.deleteCachedModel.mockReset().mockResolvedValue(1);
    vi.stubGlobal('FileReader', MockReader);
    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function uploadAndValidate(result: { current: ReturnType<typeof useAltText> }) {
    act(() => result.current.handleUpload(new File(['image'], 'photo.png', { type: 'image/png' })));
    await act(async () => { await result.current.handlePreviewLoaded('data:image/png;base64,abc'); });
}

it('switches immediately to the downloaded local model after an API error', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => options?.method === 'POST'
        ? { ok: false, status: 503, json: async () => ({ error: 'API unavailable' }) }
        : { ok: true, json: async () => ({ configured: true }) }));
    const pipeline = Object.assign(vi.fn(async () => [{ generated_text: 'a red car' }]), { dispose: vi.fn() });
    mocks.loadModel.mockResolvedValue(pipeline);
    const { result } = renderHook(() => useAltText());
    await waitFor(() => expect(result.current.modelCached).toBe(true));
    await uploadAndValidate(result);
    await waitFor(() => expect(result.current.error).toBe('API unavailable'));
    act(() => result.current.changeMethod('local'));
    expect(result.current.method).toBe('local');
    expect(result.current.error).toBe('');
    await waitFor(() => expect(result.current.altText).toBe('A red car'));
});

it('does not replace the API result with a late local result', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => options?.method === 'POST'
        ? { ok: true, json: async () => ({ alt: 'API caption' }) }
        : { ok: true, json: async () => ({ configured: true }) });
    vi.stubGlobal('fetch', fetchMock);
    let finishLocal!: (value: Array<{ generated_text: string }>) => void;
    const pipeline = Object.assign(vi.fn(() => new Promise<Array<{ generated_text: string }>>(resolve => { finishLocal = resolve; })), { dispose: vi.fn() });
    mocks.loadModel.mockResolvedValue(pipeline);
    const { result } = renderHook(() => useAltText());
    await uploadAndValidate(result);
    await waitFor(() => expect(result.current.altText).toBe('API caption'));
    act(() => result.current.changeMethod('local'));
    await waitFor(() => expect(pipeline).toHaveBeenCalled());
    act(() => result.current.changeMethod('api'));
    await waitFor(() => expect(result.current.altText).toBe('API caption'));
    await act(async () => { finishLocal([{ generated_text: 'stale local caption' }]); });
    expect(result.current.method).toBe('api');
    expect(result.current.altText).toBe('API caption');
});

it('waits for cancelled download cleanup before starting a new local load', async () => {
    mocks.cached = false;
    let finishCleanup!: (value: number) => void;
    mocks.deleteCachedModel.mockImplementationOnce(() => new Promise(resolve => { finishCleanup = resolve; }));
    const pipeline = Object.assign(vi.fn(async () => [{ generated_text: 'caption' }]), { dispose: vi.fn() });
    mocks.loadModel.mockImplementationOnce((_progress, signal: AbortSignal) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true });
    })).mockResolvedValueOnce(pipeline);
    const { result } = renderHook(() => useAltText());
    act(() => result.current.changeMethod('local'));
    await waitFor(() => expect(mocks.loadModel).toHaveBeenCalledTimes(1));
    act(() => { void result.current.cancelLocalModelSetup(); });
    expect(result.current.method).toBe('api');
    await waitFor(() => expect(mocks.deleteCachedModel).toHaveBeenCalledTimes(1));
    act(() => result.current.changeMethod('local'));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(mocks.loadModel).toHaveBeenCalledTimes(1);
    await act(async () => { finishCleanup(1); });
    await waitFor(() => expect(mocks.loadModel).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.modelReady).toBe(true));
});

it('does not start API generation while local download confirmation is pending', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => options?.method === 'POST'
        ? { ok: true, json: async () => ({ alt: 'API caption' }) }
        : { ok: true, json: async () => ({ configured: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const pipeline = Object.assign(vi.fn(async () => [{ generated_text: 'a red car' }]), { dispose: vi.fn() });
    mocks.loadModel.mockResolvedValue(pipeline);
    const { result } = renderHook(() => useAltText());
    act(() => result.current.prepareLocalModel());
    await uploadAndValidate(result);
    act(() => result.current.setOutputStyle('short'));
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0);
    expect(mocks.loadModel).not.toHaveBeenCalled();
    act(() => result.current.changeMethod('local'));
    await waitFor(() => expect(result.current.altText).toBe('A red car'));
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0);
});
