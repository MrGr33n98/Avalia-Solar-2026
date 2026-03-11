import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MediaGallery from '@/app/dashboard/components/MediaGallery';
import { Context7Provider } from '@/app/context7/provider';

const mockTrackGalleryDwell = jest.fn();

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(async (endpoint: string) => {
    if (endpoint.includes('/company_dashboard/media')) {
      return { photos: [] };
    }
    if (endpoint.includes('/company_dashboard/videos')) {
      return { videos: [] };
    }
    return {};
  }),
  companiesApi: {
    getById: jest.fn(async () => ({
      id: 1,
      name: 'Empresa Teste',
      featured: false,
      verified: false,
    })),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
  })),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useImageGalleryWatch: jest.fn(() => ({
    trackGalleryDwell: mockTrackGalleryDwell,
  })),
}));

describe('MediaGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza cabeçalho e estado vazio sem controles', async () => {
    render(
      <Context7Provider>
        <MediaGallery companyId="1" showControls={false} showHeader />
      </Context7Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Galeria de Mídia')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma foto adicionada')).toBeInTheDocument();
    });

    expect(screen.queryByText('Upload de Fotos')).not.toBeInTheDocument();
    expect(screen.queryByText('Adicionar Vídeo')).not.toBeInTheDocument();
  });

  it('dispara dwell tracking ao fechar lightbox depois de mais de 5 segundos', async () => {
    jest.useFakeTimers();

    const { fetchApi } = jest.requireMock('@/lib/api') as {
      fetchApi: jest.Mock;
    };

    fetchApi.mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/company_dashboard/media')) {
        return { photos: ['/uploads/photo-1.jpg'] };
      }
      if (endpoint.includes('/company_dashboard/videos')) {
        return { videos: [] };
      }
      return {};
    });

    const { container } = render(
      <Context7Provider>
        <MediaGallery companyId="1" showControls={false} showHeader />
      </Context7Provider>
    );

    await waitFor(() => {
      expect(container.querySelector('img[src*="photo-1.jpg"]')).not.toBeNull();
    });

    const galleryPhoto = container.querySelector('img[src*="photo-1.jpg"]');
    expect(galleryPhoto).not.toBeNull();

    const photoButton = galleryPhoto?.closest('button');
    expect(photoButton).not.toBeNull();

    fireEvent.click(photoButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText('Visualização')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(6001);
    });

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(mockTrackGalleryDwell).toHaveBeenCalledTimes(1);
    });

    expect(mockTrackGalleryDwell).toHaveBeenCalledWith(expect.any(Number), 0);
    expect(mockTrackGalleryDwell.mock.calls[0][0]).toBeGreaterThan(5000);

    jest.useRealTimers();
  });
});
