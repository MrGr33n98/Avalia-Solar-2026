import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { PropsWithChildren } from 'react';
import CompanyCTAGroup from './CompanyCTAGroup';
import type { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { trackCTAClick } from '@/lib/analytics/track-cta';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock('@/lib/lead-engine', () => ({
  openLeadModal: jest.fn(),
  resolveWizardCategoryId: jest.fn().mockReturnValue(1),
}));

jest.mock('@/lib/analytics/track-cta', () => ({
  trackCTAClick: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: jest.fn(),
}));

const paidCompany = {
  id: 1,
  name: 'Empresa Teste',
  slug: 'empresa-teste',
  has_paid_plan: true,
  cta_whatsapp_enabled: true,
  cta_whatsapp_url: 'https://wa.me/5547999545370',
  feature_access: {
    custom_ctas: { state: 'enabled', value: true },
    whatsapp_contact_button: { state: 'enabled', value: true },
  },
} as unknown as Company;

describe('CompanyCTAGroup — Brand Page PWA compacta + gates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComparison as jest.Mock).mockReturnValue({
      isInComparison: jest.fn().mockReturnValue(false),
      addToComparison: jest.fn(),
      removeFromComparison: jest.fn(),
      canAddMore: true,
    });
  });

  it('plano pago ativo: orçamento + WhatsApp no topo, Comparar + Avaliar compactos abaixo', () => {
    render(<CompanyCTAGroup company={paidCompany} canRequestQuote />);

    const quote = screen.getByRole('button', { name: 'Solicitar orçamento' });
    const whatsapp = screen.getByRole('link', { name: 'Falar com Empresa Teste no WhatsApp' });
    const compare = screen.getByRole('checkbox', { name: /Adicionar Empresa Teste à comparação/ });
    const review = screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' });

    expect(quote).toHaveClass('h-11', 'min-h-11', 'w-full');
    expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5547999545370');
    expect(whatsapp).toHaveAttribute('target', '_blank');
    expect(compare).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(review).toHaveTextContent('Avaliar');
    expect(review).not.toHaveTextContent('Avaliar empresa');
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass(
      'grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]'
    );
    expect(screen.getByTestId('company-secondary-ctas')).toHaveClass('grid-cols-2');

    fireEvent.click(whatsapp);
    expect(trackCTAClick).toHaveBeenCalledWith(expect.objectContaining({
      ctaType: 'whatsapp',
      ctaLocation: 'hero',
      companyId: '1',
    }));
  });

  it('Free: não libera conversão paga mesmo que flags e números estejam configurados', () => {
    render(<CompanyCTAGroup company={{ ...paidCompany, has_paid_plan: false }} canRequestQuote />);

    expect(screen.queryByTestId('company-primary-ctas')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' })).toHaveTextContent('Avaliar');
  });

  it.each([
    ['assinatura sem entitlement WhatsApp', { feature_access: { custom_ctas: { state: 'enabled', value: true } } }],
    ['WhatsApp desabilitado', { cta_whatsapp_enabled: false }],
    ['sem contato', { cta_whatsapp_url: null, whatsapp_url: null, whatsapp: null }],
    ['link externo inválido', { cta_whatsapp_url: 'https://evil.example/' }],
  ])('%s: mantém orçamento sem exibir WhatsApp', (_label, override) => {
    render(<CompanyCTAGroup company={{ ...paidCompany, ...override } as Company} canRequestQuote />);
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass('grid-cols-1');
  });

  it('plano pago com quote bloqueado: pode manter WhatsApp se esse entitlement estiver ativo', () => {
    const company = {
      ...paidCompany,
      feature_access: {
        custom_ctas: { state: 'locked', value: false },
        whatsapp_contact_button: { state: 'enabled', value: true },
      },
    } as unknown as Company;
    render(<CompanyCTAGroup company={company} canRequestQuote />);

    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /no WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass('grid-cols-1');
  });

  it('preferência independente: somente WhatsApp, sem orçamento', () => {
    render(<CompanyCTAGroup company={{ ...paidCompany, quote_cta_enabled: false }} canRequestQuote />);
    expect(screen.queryByRole('button', { name: 'Solicitar orçamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /no WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByTestId('company-primary-ctas')).toHaveClass('grid-cols-1');
  });

  it('preferência independente: somente orçamento, sem WhatsApp', () => {
    render(<CompanyCTAGroup company={{ ...paidCompany, cta_whatsapp_enabled: false, whatsapp_enabled: false }} canRequestQuote />);
    expect(screen.getByRole('button', { name: 'Solicitar orçamento' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /no WhatsApp/ })).not.toBeInTheDocument();
  });

  it('ambas desativadas: mantém somente Comparar e Avaliar', () => {
    render(<CompanyCTAGroup company={{ ...paidCompany, quote_cta_enabled: false, cta_whatsapp_enabled: false }} canRequestQuote />);
    expect(screen.queryByTestId('company-primary-ctas')).not.toBeInTheDocument();
    expect(screen.getByTestId('company-secondary-ctas')).toBeInTheDocument();
  });

  it('molduras secundárias 36px e alvos acionáveis 44px no mobile/PWA', () => {
    render(<CompanyCTAGroup company={paidCompany} canRequestQuote />);
    const secondary = screen.getByTestId('company-secondary-ctas');
    expect(secondary).toHaveClass('gap-1.5');
    expect(screen.getByRole('link', { name: 'Avaliar empresa: Empresa Teste' })).toHaveClass('h-11');
    expect(screen.getByText('Avaliar').parentElement).toHaveClass('h-9', 'px-2');
    expect(screen.getByText('Comparar').closest('label')).toHaveClass('!min-h-11');
  });
});
