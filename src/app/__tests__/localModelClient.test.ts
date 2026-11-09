import { afterEach, expect, it, vi } from 'vitest';
import { loadLocalModel } from '../lib/localModelClient';

class FakeWorker {
    static current: FakeWorker;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    messages: Array<{ type: string; id: number }> = [];
    terminated = false;
    constructor() { FakeWorker.current = this; }
    postMessage(message: { type: string; id: number }) { this.messages.push(message); }
    terminate() { this.terminated = true; }
    reply(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

afterEach(() => vi.unstubAllGlobals());

it('runs model requests in a worker and resolves their matching results', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const controller = new AbortController();
    const loading = loadLocalModel(() => {}, controller.signal);
    const worker = FakeWorker.current;
    expect(worker.messages[0].type).toBe('load');
    worker.reply({ type: 'loaded', id: 0 });
    const model = await loading;
    const result = model('image');
    const request = worker.messages[1];
    worker.reply({ type: 'result', id: request.id, result: [{ generated_text: 'caption' }] });
    await expect(result).resolves.toEqual([{ generated_text: 'caption' }]);
    await model.dispose();
    expect(worker.terminated).toBe(true);
});

it('aborts an in-progress download and terminates the worker', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const controller = new AbortController();
    const loading = loadLocalModel(() => {}, controller.signal);
    const worker = FakeWorker.current;
    controller.abort();
    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminated).toBe(true);
});
