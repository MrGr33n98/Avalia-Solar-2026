import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HostProvider } from '../../src/bridge/host-adapter';
import { CategoriesWidgetView } from '../../src/widgets/CategoriesWidget';
import { CompareStandaloneView } from '../../src/widgets/CompareStandalone';
import { ProfileStandaloneView } from '../../src/widgets/ProfileStandalone';
import { ReputationStandaloneView } from '../../src/widgets/ReputationStandalone';
import { SearchWidgetView } from '../../src/widgets/SearchWidget';
import {
  FIXTURE_CATEGORIES,
  FIXTURE_COMPARE,
  FIXTURE_INTEGRATORS,
  FIXTURE_PROFILE,
  FIXTURE_REPUTATION_ZERO,
} from '../../src/fixtures/staging-fixtures';

describe('R1 MCP Interactive UI Widgets', () => {
  beforeEach(() => {
    delete window.__AVALIA_MCP_HARNESS__;
  });

  it('W01+W02: SearchWidget renders cards, separates sede from declared coverage, and triggers comparison', async () => {
    const callTool = vi.fn().mockResolvedValue({ structuredContent: FIXTURE_COMPARE });
    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_INTEGRATORS,
      callTool,
    };

    render(
      <HostProvider appName="search-test">
        <SearchWidgetView />
      </HostProvider>
    );

    expect(screen.getByText('Solar Staging Alfa LTDA')).toBeInTheDocument();
    expect(screen.getByText(/Cobertura não informada/i)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox', { name: /Comparar/i });
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    const compareBtn = screen.getByRole('button', { name: /Comparar \(2\)/i });
    expect(compareBtn).toBeEnabled();
    fireEvent.click(compareBtn);

    await vi.waitFor(() => {
      expect(callTool).toHaveBeenCalledWith('compare_integrators', { company_ids: [3, 4] });
    });
    expect(await screen.findByText(/Comparação \(3 integradores\)/i)).toBeInTheDocument();
  });

  it('W03+W05: ProfileStandaloneView displays verification caveat, coverage distinction, and official link', () => {
    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_PROFILE,
    };

    render(
      <HostProvider appName="profile-test">
        <ProfileStandaloneView />
      </HostProvider>
    );

    expect(screen.getByText(/Solar Staging Alfa LTDA/i)).toBeInTheDocument();
    expect(screen.getByText(/não substitui vistoria técnica/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir perfil oficial/i })).toHaveAttribute(
      'href',
      'https://www.avaliasolar.com.br/companies/solar-staging-alfa'
    );
  });

  it('W04: ReputationStandaloneView renders null rating cleanly for 0 approved reviews', () => {
    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_REPUTATION_ZERO,
    };

    render(
      <HostProvider appName="rep-test">
        <ReputationStandaloneView />
      </HostProvider>
    );

    expect(screen.getByText(/Sem avaliações \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Nota não atribuída/i)).toBeInTheDocument();
  });

  it('W06: CompareStandaloneView displays unknown fields and never declares a winner', () => {
    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_COMPARE,
    };

    render(
      <HostProvider appName="cmp-test">
        <CompareStandaloneView />
      </HostProvider>
    );

    expect(screen.getByText(/sem vencedor absoluto/i)).toBeInTheDocument();
    expect(screen.getAllByText('Não informado').length).toBeGreaterThanOrEqual(2);
  });

  it('W07: CategoriesWidgetView drills down into list_integrators on category selection', async () => {
    const callTool = vi.fn().mockResolvedValue({ structuredContent: FIXTURE_INTEGRATORS });
    window.__AVALIA_MCP_HARNESS__ = {
      toolOutput: FIXTURE_CATEGORIES,
      callTool,
    };

    render(
      <HostProvider appName="cat-test">
        <CategoriesWidgetView />
      </HostProvider>
    );

    fireEvent.click(screen.getByText('Projetos Comerciais'));

    await vi.waitFor(() => {
      expect(callTool).toHaveBeenCalledWith('list_integrators', {
        category_slug: 'projetos-comerciais',
        sort: 'review_count',
        limit: 20,
      });
    });
    expect(await screen.findByText('Solar Staging Alfa LTDA')).toBeInTheDocument();
  });
});
