import React from 'react';
import { SolarCalculator, FinancingSimulator } from '../src/blocks/SimulationPanels';
import { CompanyCarousel, FavoriteCompanies, TrustEvidence, DirectoryIntelligence, Recommendations } from '../src/blocks/DiscoveryPanels';
import { ProductComparator, CoverageGrid, QuoteDraft, NewsletterPreview, ReviewHighlights } from '../src/blocks/CatalogPanels';
import { CompanyComparisonTable } from '../src/blocks/CompanyComparisonTable';
import { EvidenceCard } from '../src/blocks/EvidenceCard';
import { ReviewDistribution } from '../src/blocks/ReviewDistribution';
import { SolarCompanyCard } from '../src/blocks/SolarCompanyCard';
import { SolarCompanyList } from '../src/blocks/SolarCompanyList';
import { EmptyState, ErrorState, SkeletonList } from '../src/design/primitives';
import {
  FIXTURE_COMPARE,
  FIXTURE_INTEGRATORS,
  FIXTURE_REPUTATION_LARGE,
  FIXTURE_REPUTATION_ZERO,
} from '../src/fixtures/staging-fixtures';

// Playground (Spec 021 / T043). Somente fixtures sintéticas explícitas; nunca empacotado nas superfícies MCP.
export type PreviewState = 'ready' | 'loading' | 'empty' | 'error';

export interface PlaygroundItem {
  name: string;
  group: 'Marketplace' | 'Trust';
  render: (state: PreviewState) => React.ReactNode;
}

const noop = () => undefined;
const companies = FIXTURE_INTEGRATORS.data.integrators;

function byState(state: PreviewState, ready: () => React.ReactNode, emptyTitle: string): React.ReactNode {
  if (state === 'loading') return <SkeletonList count={2} />;
  if (state === 'error') return <ErrorState message="Falha simulada no playground (fixture)." onRetry={noop} />;
  if (state === 'empty') return <EmptyState title={emptyTitle} description="Sem dados para este estado (fixture)." />;
  return ready();
}

export const PLAYGROUND_ITEMS: PlaygroundItem[] = [
  {
    name: 'solar-company-card',
    group: 'Marketplace',
    render: (state) =>
      byState(state, () => (
        <SolarCompanyCard
          data={{ company: companies[1] }}
          actions={{ onViewProfile: noop, onViewReputation: noop, onToggleCompare: noop }}
          control={{ selected: false, canSelect: true }}
        />
      ), 'Nenhum integrador'),
  },
  {
    name: 'solar-company-list',
    group: 'Marketplace',
    render: (state) =>
      byState(state, () => (
        <SolarCompanyList
          data={{ companies }}
          actions={{ onViewProfile: noop, onViewReputation: noop, onToggleCompare: noop }}
          appearance={{ variant: 'grid' }}
          control={{ selectedIds: [3], maxSelected: 3 }}
        />
      ), 'Nenhum integrador encontrado'),
  },
  {
    name: 'company-comparison-table',
    group: 'Marketplace',
    render: (state) =>
      byState(state, () => <CompanyComparisonTable data={FIXTURE_COMPARE.data} />, 'Nenhuma comparação carregada'),
  },
  {
    name: 'review-distribution',
    group: 'Trust',
    render: (state) =>
      byState(state, () => (
        <div className="as-stack">
          <ReviewDistribution
            data={{
              totalApproved: FIXTURE_REPUTATION_LARGE.data.total_approved,
              distribution: FIXTURE_REPUTATION_LARGE.data.rating_distribution,
            }}
          />
          <ReviewDistribution
            data={{
              totalApproved: FIXTURE_REPUTATION_ZERO.data.total_approved,
              distribution: FIXTURE_REPUTATION_ZERO.data.rating_distribution,
            }}
          />
        </div>
      ), 'Reputação indisponível'),
  },
  {
    name: 'evidence-card',
    group: 'Trust',
    render: (state) =>
      byState(state, () => (
        <EvidenceCard
          data={{
            sourceType: FIXTURE_INTEGRATORS.source_type,
            dataAsOf: FIXTURE_INTEGRATORS.data_as_of,
            limitations: FIXTURE_INTEGRATORS.limitations,
          }}
        />
      ), 'Sem metadados'),
  },
  ...([
    ['company-carousel', 'Marketplace', () => <CompanyCarousel companies={companies} />],
    ['coverage-grid', 'Marketplace', () => <CoverageGrid coverage={companies[0].declared_coverage} />],
    ['product-comparator', 'Marketplace', () => <ProductComparator products={[{ id: 'fixture-a', name: 'Produto A (fixture)', category: 'Inversor', summary: 'Descrição de teste' }, { id: 'fixture-b', name: 'Produto B (fixture)', category: 'Inversor', summary: '' }]} />],
    ['review-highlights', 'Trust', () => <ReviewHighlights reviews={[]} />],
    ['solar-calculator', 'Marketplace', () => <SolarCalculator />],
    ['financing-simulator', 'Marketplace', () => <FinancingSimulator />],
    ['quote-draft', 'Marketplace', () => <QuoteDraft />],
    ['favorite-companies', 'Marketplace', () => <FavoriteCompanies companies={companies} />],
    ['newsletter-preview', 'Marketplace', () => <NewsletterPreview />],
    ['directory-intelligence', 'Trust', () => <DirectoryIntelligence companies={companies} />],
    ['trust-evidence', 'Trust', () => <TrustEvidence company={companies[0]} />],
    ['recommendations', 'Marketplace', () => <Recommendations companies={companies} />],
  ] satisfies [string, PlaygroundItem['group'], () => React.ReactNode][]).map(([name, group, render]) => ({
    name, group, render: (state: PreviewState) => byState(state, render, 'Sem dados disponíveis'),
  })),

];
