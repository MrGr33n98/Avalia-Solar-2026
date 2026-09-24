import { render, screen } from '@testing-library/react';
import { RankingStateBanner } from './RankingStateBanner';

describe('RankingStateBanner', () => {
  it('renders nothing when status is ready and no fallback is active', () => {
    const { container } = render(<RankingStateBanner status="ready" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders processing state title and description', () => {
    render(<RankingStateBanner status="processing" />);
    expect(screen.getByText('Ranking em processamento')).toBeInTheDocument();
  });

  it('renders fallback scope explanation when ladder resolution broadened territory', () => {
    render(
      <RankingStateBanner
        status="ready"
        fallback={{
          active: true,
          requested: 'Florianópolis',
          resolved: 'estadual (SC)',
          reason: 'insufficient_population',
        }}
        asOf="2026-09-24"
        methodologyRelease="organic-performance-v2@2.0.0"
      />
    );

    expect(screen.getByText('Escopo ajustado para representatividade estatística')).toBeInTheDocument();
    expect(screen.getByText(/Florianópolis/)).toBeInTheDocument();
    expect(screen.getByText(/estadual \(SC\)/)).toBeInTheDocument();
    expect(screen.getByText(/Base de dados: 2026-09-24/)).toBeInTheDocument();
    expect(screen.getByText(/Metodologia: organic-performance-v2@2.0.0/)).toBeInTheDocument();
  });

  it('renders analysis calibration notice when analysisAvailable is false', () => {
    render(<RankingStateBanner status="ready" analysisAvailable={false} />);

    expect(screen.getByText('Análise estatística avançada em calibração')).toBeInTheDocument();
  });
});
