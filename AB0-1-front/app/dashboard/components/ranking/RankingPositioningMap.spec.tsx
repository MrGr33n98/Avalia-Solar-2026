import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingPositioningMap } from './RankingPositioningMap';
import type { RankingData, PositioningPoint } from '@/lib/api';

// Mock MagicQuadrant para testar o interaction model sem depender do motor SVG do JSDOM
jest.mock('../MagicQuadrant', () => {
  return function MockMagicQuadrant({
    data,
    onSelectCompany,
  }: {
    data: PositioningPoint[];
    onSelectCompany?: (point: PositioningPoint) => void;
  }) {
    return (
      <div data-testid="magic-quadrant">
        {data.map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => onSelectCompany?.(point)}
          >
            {point.name}
          </button>
        ))}
      </div>
    );
  };
});

describe('RankingPositioningMap & Positioning Workspace', () => {
  const mockCurrentPoint: PositioningPoint = {
    id: 101,
    name: 'Company Alpha Solar',
    rating: 4.8,
    x_score: 70.1,
    y_score: 6.5,
    completeness_of_vision: 70.1,
    ability_to_execute: 6.5,
    is_current_company: true,
    ranking_position: 5,
    quadrant_label: 'Especialistas',
    x_breakdown: {
      trust_score: 40.0,
      verification: 20.0,
      review_credibility: 10.0,
      badge_depth: 0.0,
      social_proof: 0.0,
    },
    y_breakdown: {
      leads: 4.3,
      engagement: 0.0,
      conversion_efficiency: 0.0,
      operational_maturity: 2.2,
    },
  };

  const mockCompetitorPoint: PositioningPoint = {
    id: 102,
    name: 'Competitor Beta Energy',
    rating: 4.5,
    x_score: 82.0,
    y_score: 45.0,
    completeness_of_vision: 82.0,
    ability_to_execute: 45.0,
    is_current_company: false,
    ranking_position: 2,
    quadrant_label: 'Referências',
    x_breakdown: {
      trust_score: 42.0,
      verification: 20.0,
      review_credibility: 15.0,
      badge_depth: 5.0,
      social_proof: 0.0,
    },
    y_breakdown: {
      leads: 20.0,
      engagement: 15.0,
      conversion_efficiency: 5.0,
      operational_maturity: 5.0,
    },
  };

  const mockQuadrant: RankingData['quadrant'] = {
    status: 'ready',
    preview: false,
    points: [mockCurrentPoint, mockCompetitorPoint],
    methodology: { version: 'positioning-v1', threshold_method: 'median' },
    population: { eligible: 458, displayed: 2, minimum_required: 5 },
    thresholds: {
      method: 'median',
      population_size: 458,
      x_threshold: 51.5,
      y_threshold: 2.2,
      distinct_x: 20,
      distinct_y: 15,
    },
    resolved_scope: {
      type: 'global',
      category_id: null,
      state: null,
      city: null,
      sector: null,
    },
    meta: {
      x_axis_label: 'Autoridade de Confiança',
      y_axis_label: 'Poder de Execução',
      x_axis_definition: 'Reputação e Presença',
      y_axis_definition: 'Capacidade de Entrega',
    },
  };

  const mockCompany = {
    id: 101,
    name: 'Company Alpha Solar',
    city: 'Florianópolis',
    state: 'SC',
    sector: 'Integrador',
    slug: 'company-alpha-solar',
  };

  it('renders the header with methodology badge and population count', () => {
    render(<RankingPositioningMap quadrant={mockQuadrant} company={mockCompany} />);

    expect(screen.getByText('Mapa de Posicionamento')).toBeInTheDocument();
    expect(screen.getByText('positioning-v1')).toBeInTheDocument();
    expect(screen.getByText(/458 empresas comparáveis/i)).toBeInTheDocument();
    expect(screen.getByText(/2 exibidas no mapa/i)).toBeInTheDocument();
  });

  it('defaults the inspector to the current company with exact scores', () => {
    render(<RankingPositioningMap quadrant={mockQuadrant} company={mockCompany} />);

    // Deve exibir o nome da empresa e a tag de posição atual
    expect(screen.getByRole('heading', { name: 'Company Alpha Solar' })).toBeInTheDocument();
    expect(screen.getByText('Posição atual')).toBeInTheDocument();
    expect(screen.getByText(/Florianópolis, SC • Integrador/i)).toBeInTheDocument();

    // Scores exatos (aparecem no card de KPI e no cabeçalho do breakdown)
    expect(screen.getAllByText('70.1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('6.5').length).toBeGreaterThanOrEqual(1);

    // Comparação com a mediana (+18.6 pts)
    expect(screen.getByText(/Acima da mediana em Autoridade/i)).toBeInTheDocument();
    expect(screen.getByText(/\+18.6 pontos vs\. mediana da população/i)).toBeInTheDocument();
  });

  it('renders score breakdown factors with exact values and labels', () => {
    render(<RankingPositioningMap quadrant={mockQuadrant} company={mockCompany} />);

    expect(screen.getByText('Trust Score')).toBeInTheDocument();
    expect(screen.getByText('40.0')).toBeInTheDocument();

    expect(screen.getByText('Geração de leads')).toBeInTheDocument();
    expect(screen.getByText('4.3')).toBeInTheDocument();

    expect(screen.getByText('Maturidade operacional')).toBeInTheDocument();
    expect(screen.getByText('2.2')).toBeInTheDocument();
  });

  it('updates the inspector when competitor point is selected', () => {
    render(<RankingPositioningMap quadrant={mockQuadrant} company={mockCompany} />);

    // Inicialmente mostra Company Alpha
    expect(screen.getByRole('heading', { name: 'Company Alpha Solar' })).toBeInTheDocument();

    // Clica no competidor Competitor Beta Energy
    const competitorButton = screen.getByRole('button', { name: 'Competitor Beta Energy' });
    fireEvent.click(competitorButton);

    // O inspector deve atualizar para Competitor Beta Energy
    expect(screen.getByRole('heading', { name: 'Competitor Beta Energy' })).toBeInTheDocument();
    expect(screen.getByText('Comparada')).toBeInTheDocument();
    expect(screen.getAllByText('82.0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('45.0').length).toBeGreaterThanOrEqual(1);
  });

  it('renders insufficient sample state without plotting invalid chart', () => {
    render(
      <RankingPositioningMap
        quadrant={{
          status: 'insufficient_sample',
          preview: false,
          points: [],
          population: { eligible: 2, displayed: 0, minimum_required: 5 },
        }}
        company={mockCompany}
      />
    );

    expect(
      screen.getByText(/Ainda não há empresas suficientes neste escopo/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/2 empresas encontradas; mínimo necessário: 5/i)).toBeInTheDocument();
  });

  it('does NOT contain any hardcoded competitor names in the UI when only fixture data is provided', () => {
    render(<RankingPositioningMap quadrant={mockQuadrant} company={mockCompany} />);

    expect(screen.queryByText('SolarEdge')).not.toBeInTheDocument();
    expect(screen.queryByText('CanadianSolar')).not.toBeInTheDocument();
    expect(screen.queryByText('WEG')).not.toBeInTheDocument();
    expect(screen.queryByText('Huawei')).not.toBeInTheDocument();
    expect(screen.queryByText('LONGi')).not.toBeInTheDocument();
    expect(screen.queryByText('GoodWe')).not.toBeInTheDocument();
    expect(screen.queryByText('Fronius')).not.toBeInTheDocument();
    expect(screen.queryByText('Solis')).not.toBeInTheDocument();
    expect(screen.queryByText('Sungrow')).not.toBeInTheDocument();
  });
});
