import React from 'react';
import { render, screen } from '@testing-library/react';
import MagicQuadrant, { applyDeterministicJitter } from './MagicQuadrant';

// Mock Recharts since ResponsiveContainer requires DOM dimensions
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

describe('MagicQuadrant Component & Jitter Algorithm', () => {
  const basePoints = [
    {
      id: 372,
      name: 'Empresa Alvo',
      completeness_of_vision: 70.1,
      ability_to_execute: 6.5,
      x_score: 70.1,
      y_score: 6.5,
      is_current_company: true,
    },
    {
      id: 101,
      name: 'Empresa Competidora 1',
      completeness_of_vision: 80.0,
      ability_to_execute: 2.2,
      x_score: 80.0,
      y_score: 2.2,
      is_current_company: false,
    },
    {
      id: 102,
      name: 'Empresa Competidora 2',
      completeness_of_vision: 80.0,
      ability_to_execute: 2.2,
      x_score: 80.0,
      y_score: 2.2,
      is_current_company: false,
    },
    {
      id: 103,
      name: 'Empresa Competidora 3',
      completeness_of_vision: 80.0,
      ability_to_execute: 2.2,
      x_score: 80.0,
      y_score: 2.2,
      is_current_company: false,
    },
  ];

  describe('applyDeterministicJitter', () => {
    it('preserves exact raw x_score and y_score while generating separated display coordinates', () => {
      const result = applyDeterministicJitter(basePoints);

      // Raw scores must be strictly preserved
      const p101 = result.find((p) => p.id === 101)!;
      const p102 = result.find((p) => p.id === 102)!;
      const p103 = result.find((p) => p.id === 103)!;

      expect(p101.x_score).toBe(80.0);
      expect(p101.y_score).toBe(2.2);
      expect(p102.x_score).toBe(80.0);
      expect(p102.y_score).toBe(2.2);

      // Display coordinates must NOT be identical (anti-collision)
      const sameDisplay =
        p101.display_x === p102.display_x && p101.display_y === p102.display_y;
      expect(sameDisplay).toBe(false);

      const sameDisplay3 =
        p101.display_x === p103.display_x && p101.display_y === p103.display_y;
      expect(sameDisplay3).toBe(false);
    });

    it('keeps current_company prioritized at exact raw coordinates when in a cluster', () => {
      const clusteredWithTarget = [
        {
          id: 372,
          name: 'Empresa Alvo',
          completeness_of_vision: 50.0,
          ability_to_execute: 50.0,
          is_current_company: true,
        },
        {
          id: 400,
          name: 'Clone 1',
          completeness_of_vision: 50.0,
          ability_to_execute: 50.0,
          is_current_company: false,
        },
      ];

      const result = applyDeterministicJitter(clusteredWithTarget);
      const target = result.find((p) => p.id === 372)!;
      const clone = result.find((p) => p.id === 400)!;

      // Current company stays centered
      expect(target.display_x).toBe(50.0);
      expect(target.display_y).toBe(50.0);

      // Clone is shifted
      expect(clone.display_x !== 50.0 || clone.display_y !== 50.0).toBe(true);

      // Target company is rendered last (top of SVG stacking order)
      expect(result[result.length - 1].id).toBe(372);
    });

    it('returns empty array when given empty list', () => {
      expect(applyDeterministicJitter([])).toEqual([]);
    });
  });

  describe('Component Rendering', () => {
    it('renders quadrant watermark labels without collapsing to the floor when yThreshold is 2.2', () => {
      render(
        <MagicQuadrant
          data={basePoints}
          thresholds={{
            method: 'median',
            population_size: 458,
            x_threshold: 51.5,
            y_threshold: 2.2,
            distinct_x: 20,
            distinct_y: 10,
          }}
          populationSize={458}
          resolvedScope="população global"
        />
      );

      expect(screen.getByText('Referências')).toBeInTheDocument();
      expect(screen.getByText('Em Expansão')).toBeInTheDocument();
      expect(screen.getByText('Especialistas')).toBeInTheDocument();
      expect(screen.getByText('Em Desenvolvimento')).toBeInTheDocument();
    });

    it('renders top quadrant badges when yThreshold is 0', () => {
      render(
        <MagicQuadrant
          data={basePoints}
          thresholds={{
            method: 'median',
            population_size: 458,
            x_threshold: 50.0,
            y_threshold: 0.0,
            distinct_x: 20,
            distinct_y: 1,
          }}
          populationSize={458}
        />
      );

      expect(screen.getByText('Referências')).toBeInTheDocument();
      expect(screen.getByText('Em Expansão')).toBeInTheDocument();
    });

    it('includes accessible aria-label with un-jittered raw scores', () => {
      render(
        <MagicQuadrant
          data={basePoints}
          thresholds={{
            method: 'median',
            population_size: 4,
            x_threshold: 51.5,
            y_threshold: 2.2,
            distinct_x: 2,
            distinct_y: 2,
          }}
        />
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Empresa Alvo: X=70.1 / Y=6.5')
      );
    });
  });
});
