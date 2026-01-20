import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MediaGallery from '@/app/dashboard/components/MediaGallery';
import { Context7Provider } from '@/app/context7/provider';

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

describe('MediaGallery', () => {
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
});
