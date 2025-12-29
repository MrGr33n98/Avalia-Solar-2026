import { render, screen } from '@testing-library/react';
import CompanyCard from '../CompanyCard';

const company = {
  id: 1,
  name: 'GoodWe',
  city: 'São Paulo',
  state: 'SP',
  description: 'Solar inverter manufacturer',
  rating_count: 0,
  average_rating: 0,
} as any;

describe('CompanyCard', () => {
  it('renders company name and location', () => {
    render(<CompanyCard company={company} />);
    expect(screen.getByText('GoodWe')).toBeInTheDocument();
    expect(screen.getByText(/São Paulo/)).toBeInTheDocument();
  });
});
