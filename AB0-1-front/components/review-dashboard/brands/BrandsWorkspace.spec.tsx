import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandsWorkspace } from './BrandsWorkspace';
import * as brandUsagesApi from '@/lib/api/reviewer-brand-usages';

jest.mock('@/lib/api/reviewer-brand-usages');
const mockedApi = brandUsagesApi as jest.Mocked<typeof brandUsagesApi>;

describe('BrandsWorkspace — PR4 Reviewer Brands Carbon UI', () => {
  const sampleUsages: brandUsagesApi.ReviewerBrandUsage[] = [
    {
      id: 'usage-1',
      brand: {
        id: 1,
        name: 'Growatt Solar',
        slug: 'growatt',
        category: 'Inversores',
        country_of_origin: 'China',
        initials: 'GS',
        logo_url: null,
        active: true,
      },
      usage_context: 'integrator_install',
      usage_context_label: 'Instalo em projetos de clientes',
      source: 'manual',
      verification_status: 'self_declared',
      visibility: 'public',
      status: 'active',
      experience_since: '2022-01',
      description: 'Instalações comerciais e residenciais.',
      consent_version: 'v1',
      opted_in_at: '2026-11-10T12:00:00Z',
      lock_version: 0,
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
    {
      id: 'usage-2',
      brand: {
        id: 2,
        name: 'Fronius Brasil',
        slug: 'fronius',
        category: 'Inversores',
        country_of_origin: 'Áustria',
        initials: 'FB',
        logo_url: null,
        active: true,
      },
      usage_context: 'personal_owner',
      usage_context_label: 'Uso pessoal / residencial',
      source: 'review_form',
      verification_status: 'evidence_verified',
      visibility: 'private',
      status: 'active',
      experience_since: null,
      description: null,
      consent_version: null,
      opted_in_at: null,
      lock_version: 1,
      created_at: '2026-11-12T12:00:00Z',
      updated_at: '2026-11-12T12:00:00Z',
    },
  ];

  const sampleSummary: brandUsagesApi.ReviewerBrandSummary = {
    total_brands: 2,
    total_usages: 2,
    verified_usages: 1,
    public_usages: 1,
    by_context: {
      integrator_install: 1,
      personal_owner: 1,
      designer_specification: 0,
      maintenance: 0,
      reseller: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.fetchReviewerBrandUsages.mockResolvedValue({
      data: sampleUsages,
      meta: { total: 2, limit: 50, next_cursor: null },
    });
    mockedApi.fetchReviewerBrandSummary.mockResolvedValue({
      data: sampleSummary,
    });
  });

  it('renderiza os KPIs reais do sumário e cartões de marcas ativas', async () => {
    render(<BrandsWorkspace />);

    // Aguarda término do loading
    await waitFor(() => {
      expect(screen.getByText('Growatt Solar')).toBeInTheDocument();
      expect(screen.getByText('Fronius Brasil')).toBeInTheDocument();
    });

    // Valida KPIs
    expect(screen.getByText('Marcas distintas')).toBeInTheDocument();
    expect(screen.getByText('Declarações ativas')).toBeInTheDocument();
    expect(screen.getByText('Verificadas')).toBeInTheDocument();
    expect(screen.getByText('Públicas no Creator')).toBeInTheDocument();

    // Valida badges honestos
    expect(screen.getAllByText('Uso declarado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Verificada').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pública').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Privada').length).toBeGreaterThanOrEqual(1);

    // Garante que não inventa pontuação mágica ou CO2
    expect(screen.queryByText(/\+20/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CO₂ evitado/i)).not.toBeInTheDocument();
  });

  it('permite filtrar marcas por busca textual de nome ou slug', async () => {
    render(<BrandsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Growatt Solar')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Filtrar marcas...');
    fireEvent.change(searchInput, { target: { value: 'Fronius' } });

    expect(screen.queryByText('Growatt Solar')).not.toBeInTheDocument();
    expect(screen.getByText('Fronius Brasil')).toBeInTheDocument();
  });

  it('permite filtrar marcas pelo contexto de uso', async () => {
    render(<BrandsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Growatt Solar')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'personal_owner' } });

    // Apenas Fronius Brasil tem contexto personal_owner
    expect(screen.queryByText('Growatt Solar')).not.toBeInTheDocument();
    expect(screen.getByText('Fronius Brasil')).toBeInTheDocument();
  });

  it('exibe empty state truthful quando usuário não possui marcas vinculadas', async () => {
    mockedApi.fetchReviewerBrandUsages.mockResolvedValueOnce({
      data: [],
      meta: { total: 0, limit: 50, next_cursor: null },
    });
    mockedApi.fetchReviewerBrandSummary.mockResolvedValueOnce({
      data: {
        total_brands: 0,
        total_usages: 0,
        verified_usages: 0,
        public_usages: 0,
        by_context: {
          integrator_install: 0,
          personal_owner: 0,
          designer_specification: 0,
          maintenance: 0,
          reseller: 0,
        },
      },
    });

    render(<BrandsWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma marca vinculada ao seu perfil')).toBeInTheDocument();
    });

    expect(screen.getByText('Vincular Primeira Marca')).toBeInTheDocument();
  });

  it('exibe estado de erro amigável com botão de tentar novamente em caso de falha de rede', async () => {
    mockedApi.fetchReviewerBrandUsages.mockRejectedValueOnce(new Error('Network error'));
    mockedApi.fetchReviewerBrandSummary.mockRejectedValueOnce(new Error('Network error'));

    render(<BrandsWorkspace />);

    await waitFor(() => {
      expect(
        screen.getByText(/Não foi possível carregar as marcas/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });
});
