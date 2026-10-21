import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectsPreview from '@/app/companies/[id]/components/ProjectsPreview';
import { Company } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn().mockResolvedValue({ projects: [] }),
}));

const mockCompany: Company = {
  id: 101,
  slug: 'weg-solar',
  name: 'WEG',
  city: 'Florianópolis',
  state: 'SC',
  status: 'active',
  verified: true,
  category: 'energia-solar',
  description: 'Fabricante líder em inversores e soluções solares',
  website: 'https://www.weg.net/',
  phone: '0800 701 0701',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  videos: [
    {
      id: 1,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
      title: 'Apresentação Institucional WEG',
      provider: 'youtube',
      video_id: 'dQw4w9WgXcQ',
    },
    {
      id: 2,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail_url: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=600',
      title: 'WEG Wallbox e Mobilidade Elétrica',
      provider: 'youtube',
      video_id: 'dQw4w9WgXcQ',
    },
  ],
  media_urls: [
    'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=600',
    'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600',
  ],
};

describe('ProjectsPreview (4-Item Media Showcase)', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section title and "Ver vitrine completa" CTA', async () => {
    render(<ProjectsPreview company={mockCompany} onTabChange={mockOnTabChange} />);

    expect(screen.getByText('Portfólio & Projetos')).toBeInTheDocument();
    expect(screen.getByText('Ver vitrine completa')).toBeInTheDocument();

    const ctaButton = screen.getByText('Ver vitrine completa').closest('button');
    fireEvent.click(ctaButton!);
    expect(mockOnTabChange).toHaveBeenCalledWith('projects');
  });

  it('renders subheader with "Galeria de mídia" and description', async () => {
    render(<ProjectsPreview company={mockCompany} onTabChange={mockOnTabChange} />);

    expect(screen.getByText('Galeria de mídia')).toBeInTheDocument();
    expect(
      screen.getByText('Imagens e vídeos publicados pela empresa.')
    ).toBeInTheDocument();
  });

  it('always renders exactly 4 media cards', async () => {
    render(<ProjectsPreview company={mockCompany} onTabChange={mockOnTabChange} />);

    // Should have 4 items rendered
    const videoBadges = await screen.findAllByText('Video');
    const imageBadges = await screen.findAllByText('Imagem');

    expect(videoBadges.length + imageBadges.length).toBe(4);
  });

  it('renders 4 items even when company has zero media uploaded (curated fallback)', async () => {
    const emptyCompany: Company = {
      ...mockCompany,
      videos: [],
      media_urls: [],
    };

    render(<ProjectsPreview company={emptyCompany} onTabChange={mockOnTabChange} />);

    const videoBadges = await screen.findAllByText('Video');
    const imageBadges = await screen.findAllByText('Imagem');

    expect(videoBadges.length + imageBadges.length).toBe(4);
  });

  it('opens video modal when a video card is clicked', async () => {
    render(<ProjectsPreview company={mockCompany} onTabChange={mockOnTabChange} />);

    const videoCard = screen.getAllByText('Video')[0].closest('div');
    expect(videoCard).toBeInTheDocument();

    fireEvent.click(videoCard!);

    // Should open dialog with video title or iframe
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
