import React from 'react';
import { render, screen } from '@testing-library/react';
import AchievementVerificationPage, { generateMetadata } from '@/app/conquistas/verificar/[token]/page';

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt || ''} {...props} />;
  },
}));

describe('AchievementVerificationPage', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders valid certificate with badge info and masked recipient name', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'valid',
        badge: {
          slug: 'review_approved_1',
          name: '1ª Avaliação Aprovada',
          description: 'Escreva e aprove sua 1ª avaliação na plataforma',
          tier: 'bronze',
          category: 'review',
          icon_url: '/assets/achievements/cards/01_review_approved_1.svg',
          points: 50,
        },
        recipient: {
          display_name: 'Felipe S.',
          member_since: '05/2024',
        },
        verification: {
          token: 'token_valid_123',
          unlocked_at: '2026-11-18T12:00:00Z',
          verified_at: '2026-11-18T18:00:00Z',
          authenticity_url: 'https://avaliasolar.com.br/conquistas/verificar/token_valid_123',
        },
      }),
    } as unknown as Response);

    const Page = await AchievementVerificationPage({ params: { token: 'token_valid_123' } });
    render(Page);

    expect(screen.getByText('1ª Avaliação Aprovada')).toBeInTheDocument();
    expect(screen.getByText('Felipe S.')).toBeInTheDocument();
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
    expect(screen.getByText(/Certificado Autêntico & Verificado/i)).toBeInTheDocument();
    expect(screen.getByText('token_valid_123')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar no LinkedIn')).toBeInTheDocument();
  });

  it('renders revoked certificate message when status is 410', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({
        status: 'revoked',
        error: 'Esta conquista foi revogada pela moderação.',
      }),
    } as unknown as Response);

    const Page = await AchievementVerificationPage({ params: { token: 'token_revoked_456' } });
    render(Page);

    expect(screen.getByText('Conquista Revogada')).toBeInTheDocument();
    expect(screen.getByText(/revogado pela moderação da Avalia Solar/i)).toBeInTheDocument();
  });

  it('renders not found message when status is 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        status: 'not_found',
      }),
    } as unknown as Response);

    const Page = await AchievementVerificationPage({ params: { token: 'token_invalid_999' } });
    render(Page);

    expect(screen.getByText('Certificado Não Encontrado')).toBeInTheDocument();
    expect(screen.getByText(/não corresponde a nenhuma conquista registrada/i)).toBeInTheDocument();
  });

  it('generates proper OpenGraph metadata for SEO and social sharing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'valid',
        badge: {
          slug: 'review_approved_1',
          name: '1ª Avaliação Aprovada',
          description: 'Escreva e aprove sua 1ª avaliação na plataforma',
          tier: 'bronze',
          category: 'review',
          icon_url: '/assets/achievements/cards/01_review_approved_1.svg',
          points: 50,
        },
        recipient: {
          display_name: 'Felipe S.',
          member_since: '05/2024',
        },
        verification: {
          token: 'token_valid_123',
          unlocked_at: '2026-11-18T12:00:00Z',
          verified_at: '2026-11-18T18:00:00Z',
          authenticity_url: 'https://avaliasolar.com.br/conquistas/verificar/token_valid_123',
        },
      }),
    } as unknown as Response);

    const metadata = await generateMetadata({ params: { token: 'token_valid_123' } });

    expect(metadata.title).toBe('Conquista Verificada: 1ª Avaliação Aprovada | Avalia Solar');
    expect(metadata.openGraph?.title).toContain('1ª Avaliação Aprovada');
    expect(metadata.openGraph?.images).toBeDefined();
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
