import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyDirectoryRow } from './CompanyDirectoryRow';
import { track } from '@/lib/analytics/consolidated';

jest.mock('@/lib/analytics/consolidated', () => ({
  track: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, email: 'test@example.com' },
  }),
}));

jest.mock('@/lib/api/favorites', () => ({
  favoritesApi: {
    create: jest.fn().mockResolvedValue({ success: true }),
    removeByItem: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: (id: number) => id === 1,
    toggleComparison: jest.fn(),
    canAddMore: true,
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    alt = '',
    fill,
    priority,
    unoptimized,
    ...props
  }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={(alt as string) || ''} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

describe('CompanyDirectoryList — Mobile & Desktop Directory List Mode', () => {
  const companies = [
    {
      id: 1,
      name: 'WEG Solar Brasil',
      slug: 'weg-solar-brasil',
      rating_avg: 4.9,
      rating_count: 88,
      verified: true,
      city: 'Jaraguá do Sul',
      state: 'SC',
    },
    {
      id: 2,
      name: 'Intelbras Solar',
      slug: 'intelbras-solar',
      rating_avg: 4.7,
      rating_count: 64,
      verified: true,
      city: 'São José',
      state: 'SC',
    },
    {
      id: 3,
      name: 'Empresa Nova Solar',
      slug: 'empresa-nova-solar',
      rating_avg: 0,
      rating_count: 0,
      verified: false,
      city: 'Palhoça',
      state: 'SC',
    },
  ];

  it('renderiza uma lista compacta vertical de empresas com data-testid e links', () => {
    render(
      <div data-testid="companies-list" className="flex flex-col gap-2.5">
        {companies.map((company, index) => (
          <CompanyDirectoryRow key={company.id} company={company} index={index} />
        ))}
      </div>
    );

    expect(screen.getByTestId('companies-list')).toBeInTheDocument();
    expect(screen.getByText('WEG Solar Brasil')).toBeInTheDocument();
    expect(screen.getByText('Intelbras Solar')).toBeInTheDocument();
    expect(screen.getByText('Empresa Nova Solar')).toBeInTheDocument();

    // Verificação de badges e status
    expect(screen.getAllByTestId('verified-badge-wrapper').length).toBe(2);
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
  });

  it('exibe o estado selecionado de comparação para empresa já incluída', () => {
    render(
      <div>
        {companies.map((company, index) => (
          <CompanyDirectoryRow key={company.id} company={company} index={index} />
        ))}
      </div>
    );

    const checkboxes = screen.getAllByRole('checkbox', { name: /comparação/i });
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });
  it('separa WhatsApp/Orçamento no topo e favoritos/comparação no rodapé, preservando a ordem interna', () => {
    const paid = {
      id: 372, name: 'WEG', slug: 'weg', city: 'Florianópolis', state: 'SC',
      has_paid_plan: true, quote_cta_enabled: true,
      cta_whatsapp_enabled: true, cta_whatsapp_url: 'https://wa.me/5547999700506',
      feature_access: {
        custom_ctas: { state: 'enabled', value: true },
        whatsapp_contact_button: { state: 'enabled', value: true },
      },
    };

    render(<CompanyDirectoryRow company={paid} />);

    const topActions = screen.getByTestId('company-directory-primary-actions');
    const bottomActions = screen.getByTestId('company-directory-actions');
    const whatsapp = screen.getByRole('link', { name: 'Falar com WEG no WhatsApp' });
    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });
    const favorite = screen.getByRole('button', { name: 'Adicionar aos favoritos' });
    const compare = screen.getByRole('checkbox', { name: /Adicionar WEG à comparação/i });

    expect(topActions).toContainElement(whatsapp);
    expect(topActions).toContainElement(quote);
    expect(bottomActions).toContainElement(favorite);
    expect(bottomActions).toContainElement(compare);
    expect(screen.getByTestId('directory-card-bottom')).toHaveTextContent('Florianópolis, SC');

    expect(whatsapp.compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(favorite.compareDocumentPosition(compare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('retains favorites and comparison, but never inserts paid CTAs on Free', () => {
    render(<CompanyDirectoryRow company={companies[2]} />);
    const actions = screen.getByTestId('company-directory-actions');
    expect(actions.querySelector('[aria-label="Adicionar aos favoritos"]')).toBeTruthy();
    expect(actions.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(actions.querySelector('a[aria-label*="WhatsApp"]')).toBeNull();
    expect(actions.querySelector('button[aria-label="Solicitar orçamento"]')).toBeNull();
    expect(screen.getByRole('link', { name: /Ver perfil de Empresa Nova Solar/ })).toHaveAttribute('href', '/companies/empresa-nova-solar');
  });

});
