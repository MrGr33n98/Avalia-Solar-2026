import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectPortfolioPreview, readPortfolioPreview } from '../../src/widgets/ProjectPortfolioPreview';

const project = {
  id: 1, title: 'Projeto solar teste', summary: 'Descrição pública',
  city: 'Florianópolis', state: 'SC', technology: 'On-grid', segment: 'Comercial',
  capacity_value: 75, capacity_unit: 'kWp', cover_url: null,
};
const portfolio = { state: 'ready' as const, items: [project], has_more: true };

describe('018A prévia de portfólio', () => {
  it('reads the optional public payload without breaking legacy profiles', () => {
    expect(readPortfolioPreview({ data: { integrator: {} } })).toBeUndefined();
    expect(readPortfolioPreview({ data: { integrator: { portfolio_preview: portfolio } } })).toEqual(portfolio);
  });

  it('renders public project facts and the bounded preview notice', () => {
    render(<ProjectPortfolioPreview portfolio={portfolio} />);
    expect(screen.getByText('Projeto solar teste')).toBeInTheDocument();
    expect(screen.getByText('75 kWp')).toBeInTheDocument();
    expect(screen.getByText('Sem foto disponível')).toBeInTheDocument();
    expect(screen.getByText(/Prévia de até 3 projetos/)).toBeInTheDocument();
  });

  it('does not render a locked portfolio', () => {
    render(<ProjectPortfolioPreview portfolio={{ state: 'unavailable', items: [], has_more: false }} />);
    expect(screen.queryByRole('region', { name: 'Portfólio de projetos' })).not.toBeInTheDocument();
  });
});
