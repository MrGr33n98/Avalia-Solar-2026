import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CompanySidebar from '@/app/companies/[id]/components/CompanySidebar';
import { Company } from '@/lib/api';

const mockTrackQuestion = jest.fn();

jest.mock('@/app/companies/[id]/components/SponsoredBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="sponsored-banner" />,
}));

jest.mock('@/app/companies/[id]/components/ClaimCompanyCard', () => ({
  __esModule: true,
  default: () => <div data-testid="claim-company-card" />,
}));

jest.mock('@/app/companies/[id]/components/CompanyAwardsCard', () => ({
  __esModule: true,
  default: () => <div data-testid="company-awards-card" />,
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn(),
}));

jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useCopyIntent: jest.fn(() => ({
    onCopy: jest.fn(),
  })),
  useFaqExpand: jest.fn(() => ({
    trackQuestion: mockTrackQuestion,
  })),
  useHoverIntent: jest.fn(() => ({
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
  })),
}));

const getMockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 42,
  slug: 'empresa-teste',
  name: 'Empresa Teste',
  city: 'Sao Paulo',
  state: 'SP',
  status: 'active',
  verified: true,
  category: 'energia-solar',
  description: 'Descricao da empresa',
  website: 'https://empresa-teste.example.com',
  phone: '(11) 99999-0000',
  address: 'Rua Exemplo, 123',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  faqs: [
    {
      id: 101,
      question: 'Qual o prazo medio da instalacao?',
      answer: 'Entre 30 e 45 dias.',
    },
    {
      id: 102,
      question: 'Vocês atendem condominios?',
      answer: 'Sim, com projeto dedicado.',
    },
  ],
  ...overrides,
});

describe('CompanySidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispara tracking ao expandir uma pergunta frequente', async () => {
    render(<CompanySidebar company={getMockCompany()} />);

    fireEvent.click(screen.getByRole('button', { name: /qual o prazo medio da instalacao\?/i }));

    await waitFor(() => {
      expect(mockTrackQuestion).toHaveBeenCalledTimes(1);
    });

    expect(mockTrackQuestion).toHaveBeenCalledWith(101);
    expect(screen.getByText('Entre 30 e 45 dias.')).toBeInTheDocument();
  });

  it('oculta FAQ e banners de concorrentes quando os guards publicos desabilitam esses blocos', () => {
    render(
      <CompanySidebar
        company={getMockCompany()}
        showFaq={false}
        showCompetitorBanners={false}
      />
    );

    expect(screen.queryByText('Dúvidas frequentes')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sponsored-banner')).not.toBeInTheDocument();
  });
});
