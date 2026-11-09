import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ImageInput from '../components/ImageInput';

vi.mock('../components/ImagePreview', () => ({ default: () => <span>Preview</span> }));
afterEach(cleanup);

it('keeps the drag state while crossing child elements and uploads dropped files', () => {
    const onUpload = vi.fn();
    const { container } = render(<ImageInput urlOpen={false} value="" imageSrc="" imageVersion={0}
        onChange={() => {}} onUrlErrorDismiss={() => {}} onSubmit={() => {}} onPreviewLoad={() => {}} onUpload={onUpload} onRemove={() => {}} />);
    const zone = screen.getByRole('button', { name: 'Upload image' });
    const transfer = { types: ['Files'], files: [new File(['image'], 'photo.png', { type: 'image/png' })], dropEffect: '' };
    fireEvent.dragEnter(zone, { dataTransfer: transfer });
    fireEvent.dragEnter(zone.firstElementChild!, { dataTransfer: transfer });
    fireEvent.dragLeave(zone.firstElementChild!, { dataTransfer: transfer });
    expect(container.querySelector('.uploadWindowDragOver')).toBeTruthy();
    fireEvent.drop(zone, { dataTransfer: transfer });
    expect(onUpload).toHaveBeenCalledWith(transfer.files[0]);
    expect(container.querySelector('.uploadWindowDragOver')).toBeNull();
});
