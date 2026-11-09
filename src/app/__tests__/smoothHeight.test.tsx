import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SmoothHeight from '../components/SmoothHeight';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('smoothly follows its content height and disconnects its observer', () => {
    let height = 100;
    let notify = () => {};
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ height }) as DOMRect);
    vi.stubGlobal('ResizeObserver', class {
        constructor(callback: () => void) { notify = callback; }
        observe = observe;
        disconnect = disconnect;
    });
    const { container, unmount } = render(<SmoothHeight><div>Content</div></SmoothHeight>);
    const wrapper = container.querySelector<HTMLElement>('.smoothHeight')!;
    expect(wrapper.style.height).toBe('100px');
    height = 220;
    act(() => notify());
    expect(wrapper.style.height).toBe('220px');
    expect(observe).toHaveBeenCalledOnce();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
});
