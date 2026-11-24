import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GalleryImages, readGalleryPreview } from '../../src/widgets/PublicMediaGallery';

describe('018A mídia pública', () => {
  it('expands a public image and refuses an insecure URL', () => {
    render(<GalleryImages images={['https://api.avaliasolar.com.br/photo.png', 'http://example.com/bad.png']} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar foto 1' }));
    expect(screen.getByRole('img', { name: 'Foto ampliada' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar foto' }));
    expect(screen.queryByRole('img', { name: 'Foto ampliada' })).not.toBeInTheDocument();
  });

  it('accepts an optional bounded gallery without requiring it on legacy responses', () => {
    expect(readGalleryPreview({ data: { integrator: {} } })).toBeUndefined();
    const gallery = { state: 'ready', images: [], videos: [] };
    expect(readGalleryPreview({ data: { integrator: { gallery_preview: gallery } } })).toEqual(gallery);
  });
});
