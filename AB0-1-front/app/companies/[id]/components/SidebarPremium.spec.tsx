import { fireEvent, render, screen, within } from '@testing-library/react';
import { fetchApi, type Company } from '@/lib/api';
import SidebarPremium from './SidebarPremium';

jest.mock('@/lib/api', () => ({ fetchApi: jest.fn() }));
jest.mock('@/lib/feature-access', () => ({
  hasPaidPlan: () => true,
  isFeatureEnabled: () => false,
}));
jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({
  useFaqExpand: () => ({ trackQuestion: jest.fn() }),
}));
jest.mock('@/lib/analytics/consolidated', () => ({
  trackFaqEngagement: jest.fn(),
}));
jest.mock('./CompanyContactCard', () => ({
  __esModule: true,
  default: () => <div data-testid="contact-card" />,
}));
jest.mock('./ClaimProfileCard', () => ({
  __esModule: true,
  default: () => <div data-testid="claim-profile-card" />,
}));
jest.mock('./PremiumSidebarAdSlot', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const company = {
  id: 372,
  name: 'WEG',
  badges: [],
  faqs: [],
  feature_access: {},
} as unknown as Company;

const material = {
  id: 1,
  slug: 'catalogo-weg',
  title: 'Catálogo WEG',
  description: 'Catálogo de produtos.',
  material_type: 'catalog',
  gate_mode: 'none',
  gated: false,
  file_available: true,
};

const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe('SidebarPremium: sem bloco de materiais redundante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mantém um único card de destaque com um material', async () => {
    mockFetchApi.mockResolvedValue({ materials: [material] });
    render(<SidebarPremium company={company} />);

    expect(await screen.findByTestId('featured-material-card')).toBeInTheDocument();
    expect(screen.getAllByTestId('featured-material-card')).toHaveLength(1);
    expect(screen.queryByText('Materiais da Empresa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Baixar materiais' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver todos/i })).not.toBeInTheDocument();
  });

  it('preserva acesso a todos os arquivos quando existem vários', async () => {
    mockFetchApi.mockResolvedValue({
      materials: [material, { ...material, id: 2, slug: 'guia-tecnico', title: 'Guia técnico' }],
    });
    render(<SidebarPremium company={company} />);

    const button = await screen.findByRole('button', { name: 'Ver todos os 2 materiais' });
    expect(screen.queryByText('Materiais da Empresa')).not.toBeInTheDocument();
    fireEvent.click(button);

    const dialog = screen.getByRole('dialog', { name: 'Materiais da WEG' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Catálogo WEG')).toBeInTheDocument();
    expect(within(dialog).getByText('Guia técnico')).toBeInTheDocument();
  });

  it('mantém o convite para reivindicar o perfil quando não há materiais', async () => {
    mockFetchApi.mockResolvedValue({ materials: [] });
    render(<SidebarPremium company={company} />);
    expect(await screen.findByTestId('claim-profile-card')).toBeInTheDocument();
    expect(screen.queryByTestId('featured-material-card')).not.toBeInTheDocument();
  });
});
