import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MethodSelector from '../components/MethodSelector';
import type { Method } from '../hooks/useAltText';

afterEach(cleanup);

function setup(ready = false) {
    const prepare = vi.fn();
    const cancel = vi.fn();
    const changes = vi.fn();
    function Harness() {
        const [method, setMethod] = useState<Method>('api');
        return <MethodSelector open method={method} localStatus="" modelReady={ready} modelCached={ready}
            modelCachePresent={ready} modelWorking={null} apiWorking={null} downloadProgress={null} downloadedBytes={null}
            downloadTotalBytes={null} onChange={value => { changes(value); setMethod(value); }}
            onPrepareLocalModel={prepare} onDeleteLocalModel={() => {}} onCancelLocalModelSetup={cancel} deleteDisabled={false} />;
    }
    render(<Harness />);
    const select = (name: RegExp) => {
        fireEvent.click(screen.getByRole('button', { name: /method/i }));
        fireEvent.click(screen.getByRole('option', { name }));
    };
    return { select, prepare, cancel, changes };
}

describe('method switching', () => {
    it('selects a downloaded model immediately and can switch back', () => {
        const { select, changes } = setup(true);
        select(/local/i);
        expect(screen.getByRole('button', { name: /method/i }).textContent).toContain('Local:');
        expect(changes).toHaveBeenLastCalledWith('local');
        select(/api/i);
        expect(screen.getByRole('button', { name: /method/i }).textContent).toContain('API:');
        expect(changes).toHaveBeenLastCalledWith('api');
    });

    it('shows the local selection and confirmation without starting a download', () => {
        const { select, prepare, changes, cancel } = setup();
        select(/local/i);
        expect(screen.getByRole('button', { name: /method/i }).textContent).toContain('Local:');
        expect(screen.getByRole('alertdialog')).toBeTruthy();
        expect(prepare).toHaveBeenCalledOnce();
        expect(changes).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.getByRole('button', { name: /method/i }).textContent).toContain('API:');
        expect(cancel).not.toHaveBeenCalled();
        expect(changes).toHaveBeenLastCalledWith('api');
    });

    it('starts local setup only after Continue and allows another selection', () => {
        const { select, changes } = setup();
        select(/local/i);
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        expect(changes).toHaveBeenLastCalledWith('local');
        select(/api/i);
        expect(changes).toHaveBeenLastCalledWith('api');
        expect(screen.getByRole('button', { name: /method/i }).textContent).toContain('API:');
    });
    it('can cancel immediately after Continue before loading starts', () => {
        const { select, cancel } = setup();
        select(/local/i);
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(cancel).toHaveBeenCalledOnce();
    });

});
