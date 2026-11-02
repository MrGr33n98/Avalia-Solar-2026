import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PublicReviewFormPage from '@/app/f/[token]/page';
import { fetchApi } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('source=email'),
}));

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

jest.mock('@/app/f/[token]/hooks/useReviewDraft', () => ({
  useReviewDraft: () => ({
    draft: null,
    save: jest.fn(),
    clear: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt = '',
    priority,
    unoptimized,
    fill,
    ...props
  }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

describe('PublicReviewFormPage — G2 Review Collection Landing Layout', () => {
  const mockFormData = {
    review_form: {
      id: 101,
      public_title: 'Avalie sua experiência de instalação solar',
      public_description: 'Conte para a comunidade como foi o atendimento da Solar Power Brasil.',
      form_type: 'standard',
      settings: {
        criteria: ['Qualidade técnica', 'Pontualidade'],
        comment_required: true,
        thank_you_message: 'Muito obrigado pela sua avaliação!',
      },
      criteria: [
        { id: 1, slug: 'qualidade-tecnica', title: 'Qualidade técnica', required: true },
        { id: 2, slug: 'pontualidade', title: 'Pontualidade', required: false },
      ],
      branding: {
        logo_url: 'https://example.com/solar-power-logo.png',
        accent_color: '#5448C8',
        company_name: 'Solar Power Brasil',
      },
      company: {
        id: 77,
        name: 'Solar Power Brasil',
        slug: 'solar-power-brasil',
        logo_url: 'https://example.com/solar-power-logo.png',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchApi as jest.Mock).mockResolvedValue(mockFormData);
  });

  it('renderiza o Hero de convite no estilo G2 com título, descrição e CTA', async () => {
    render(<PublicReviewFormPage params={{ token: 'token-abc' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-invite-hero')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('heading', { name: /compartilhe sua experiência sobre solar power brasil/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/consumidores e empresas consultam a avalia solar/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('review-now-cta')).toBeInTheDocument();
  });

  it('renderiza a seção de Boas Práticas inspirada no G2 com os 3 pilares', async () => {
    render(<PublicReviewFormPage params={{ token: 'token-abc' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-best-practices')).toBeInTheDocument();
    });

    expect(screen.getByText('Boas práticas para ter sua avaliação aprovada')).toBeInTheDocument();
    expect(screen.getByText('Use seu contato real')).toBeInTheDocument();
    expect(screen.getByText('Seja autêntico')).toBeInTheDocument();
    expect(screen.getByText('Compartilhe detalhes')).toBeInTheDocument();
  });

  it('renderiza a barra de veículos de referência e imprensa', async () => {
    render(<PublicReviewFormPage params={{ token: 'token-abc' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-press-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('Forbes')).toBeInTheDocument();
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
  });

  it('renderiza o formulário oficial de avaliação logo abaixo', async () => {
    render(<PublicReviewFormPage params={{ token: 'token-abc' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-form-section')).toBeInTheDocument();
    });

    expect(screen.getByText('Avalie sua experiência de instalação solar')).toBeInTheDocument();
    expect(screen.getByText(/qualidade técnica/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar avaliação/i })).toBeInTheDocument();
  });

  it('clicar em "Avaliar agora" dispara o scroll para o formulário', async () => {
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(<PublicReviewFormPage params={{ token: 'token-abc' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('review-now-cta')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('review-now-cta'));
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
