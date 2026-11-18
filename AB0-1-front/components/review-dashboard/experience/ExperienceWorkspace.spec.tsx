import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExperienceWorkspace } from './ExperienceWorkspace';
import * as projectsApi from '@/lib/api/reviewer-portfolio-projects';
import * as brandUsagesApi from '@/lib/api/reviewer-brand-usages';

jest.mock('@/lib/api/reviewer-portfolio-projects');
jest.mock('@/lib/api/reviewer-brand-usages');

const mockedProjectsApi = projectsApi as jest.Mocked<typeof projectsApi>;
const mockedBrandUsagesApi = brandUsagesApi as jest.Mocked<typeof brandUsagesApi>;

describe('ExperienceWorkspace — PR6 Reviewer Portfolio Projects & Experience', () => {
  const sampleProjects: projectsApi.ReviewerPortfolioProject[] = [
    {
      id: 'proj-1',
      title: 'Usina Solar Fazenda Esperança',
      project_type: 'rural',
      project_type_label: 'Rural / Agro',
      city: 'Ribeirão Preto',
      state: 'SP',
      started_at: '2023-01-15',
      completed_at: '2023-05-20',
      capacity_kwp: 75.5,
      visibility: 'public',
      verification_status: 'evidence_verified',
      status: 'active',
      description: 'Instalação de 140 módulos com inversor central.',
      lock_version: 0,
      brands: [
        {
          id: 'pb-1',
          brand_id: 1,
          brand_name: 'Growatt Solar',
          brand_slug: 'growatt',
          initials: 'GS',
          logo_url: null,
        },
      ],
      created_at: '2026-11-15T10:00:00Z',
      updated_at: '2026-11-15T10:00:00Z',
    },
    {
      id: 'proj-2',
      title: 'Sistema Residencial Alphaville',
      project_type: 'residential',
      project_type_label: 'Residencial',
      city: 'Campinas',
      state: 'SP',
      started_at: '2024-02-10',
      completed_at: '2024-02-28',
      capacity_kwp: 9.8,
      visibility: 'private',
      verification_status: 'self_declared',
      status: 'active',
      description: null,
      lock_version: 0,
      brands: [
        {
          id: 'pb-2',
          brand_id: 2,
          brand_name: 'Fronius Brasil',
          brand_slug: 'fronius',
          initials: 'FB',
          logo_url: null,
        },
      ],
      created_at: '2026-11-16T10:00:00Z',
      updated_at: '2026-11-16T10:00:00Z',
    },
  ];

  const sampleSummary: projectsApi.ReviewerProjectSummary = {
    total_projects: 2,
    total_capacity_kwp: 85.3,
    verified_projects: 1,
    public_projects: 1,
    by_type: {
      residential: 1,
      commercial: 0,
      rural: 1,
      industrial: 0,
      ev_charging: 0,
      bess_storage: 0,
    },
  };

  const sampleBrandUsages: brandUsagesApi.ReviewerBrandUsage[] = [
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
      usage_context_label: 'Instalação',
      source: 'manual',
      verification_status: 'evidence_verified',
      visibility: 'public',
      status: 'active',
      experience_since: '2022-01',
      description: null,
      consent_version: 'v1',
      opted_in_at: '2026-11-10T12:00:00Z',
      lock_version: 0,
      created_at: '2026-11-10T12:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedProjectsApi.fetchReviewerProjects.mockResolvedValue({
      data: sampleProjects,
      meta: { total: 2, limit: 100, offset: 0 },
    });
    mockedProjectsApi.fetchReviewerProjectSummary.mockResolvedValue({
      data: sampleSummary,
    });
    mockedBrandUsagesApi.fetchReviewerBrandUsages.mockResolvedValue({
      data: sampleBrandUsages,
      meta: { total: 1, limit: 50, offset: 0 },
    });
  });

  it('renders metric strip with truthful summary metrics', async () => {
    render(<ExperienceWorkspace />);

    await waitFor(() => {
      expect(screen.getByTestId('metric-total-projects')).toHaveTextContent('2');
      expect(screen.getByTestId('metric-total-capacity')).toHaveTextContent('85.3 kWp');
      expect(screen.getByTestId('metric-verified-projects')).toHaveTextContent('1');
      expect(screen.getByTestId('metric-public-projects')).toHaveTextContent('1');
    });

    expect(screen.getByText('Usina Solar Fazenda Esperança')).toBeInTheDocument();
    expect(screen.getByText('Sistema Residencial Alphaville')).toBeInTheDocument();
  });

  it('filters projects by search text query', async () => {
    render(<ExperienceWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Usina Solar Fazenda Esperança')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-projects-input');
    fireEvent.change(searchInput, { target: { value: 'Alphaville' } });

    expect(screen.queryByText('Usina Solar Fazenda Esperança')).not.toBeInTheDocument();
    expect(screen.getByText('Sistema Residencial Alphaville')).toBeInTheDocument();
  });

  it('filters projects by project type filter tab', async () => {
    render(<ExperienceWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Usina Solar Fazenda Esperança')).toBeInTheDocument();
    });

    const residentialTab = screen.getByRole('tab', { name: 'Residencial' });
    fireEvent.click(residentialTab);

    expect(screen.queryByText('Usina Solar Fazenda Esperança')).not.toBeInTheDocument();
    expect(screen.getByText('Sistema Residencial Alphaville')).toBeInTheDocument();
  });

  it('shows empty state when no projects match filters', async () => {
    render(<ExperienceWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Usina Solar Fazenda Esperança')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-projects-input');
    fireEvent.change(searchInput, { target: { value: 'Inexistente 999' } });

    expect(screen.getByTestId('empty-projects-state')).toBeInTheDocument();
  });

  it('deletes project after user confirmation', async () => {
    window.confirm = jest.fn(() => true);
    mockedProjectsApi.deleteReviewerProject.mockResolvedValue();

    render(<ExperienceWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Usina Solar Fazenda Esperança')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Remover projeto/i });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Usina Solar Fazenda Esperança')
    );

    await waitFor(() => {
      expect(mockedProjectsApi.deleteReviewerProject).toHaveBeenCalledWith('proj-1');
      expect(screen.queryByText('Usina Solar Fazenda Esperança')).not.toBeInTheDocument();
    });
  });
});
