import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Message from '../components/Message';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('keeps the existing alert until it closes when a new error arrives', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { container, rerender } = render(<Message message="First error" onDismiss={onDismiss} keepUntilClosed />);
    rerender(<Message message="" onDismiss={onDismiss} keepUntilClosed />);
    rerender(<Message message="Second error" onDismiss={onDismiss} keepUntilClosed />);
    expect(screen.getByText('First error')).toBeTruthy();
    expect(screen.queryByText('Second error')).toBeNull();
    act(() => vi.advanceTimersByTime(8000));
    const panel = container.querySelector('.messageReveal')!;
    const transition = new Event('transitionend', { bubbles: true });
    Object.defineProperty(transition, 'propertyName', { value: 'grid-template-rows' });
    fireEvent(panel, transition);
    expect(screen.getByText('Second error')).toBeTruthy();
    expect(onDismiss).not.toHaveBeenCalled();
});
