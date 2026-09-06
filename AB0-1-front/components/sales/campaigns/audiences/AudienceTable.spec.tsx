import { render, screen } from '@testing-library/react';
import { AudienceTable } from './AudienceTable';

describe('AudienceTable', () => {
  it('renders semantic headers and contacts', () => {
    render(<AudienceTable data={{ total_count: 1, page: 1, per_page: 20, total_pages: 1, sample_contacts: [{ id: 1, first_name: 'Maria', last_name: 'Silva', email: 'maria@solar.com', account_name: 'Solar Prime', city: 'Cuiabá', state: 'MT' }] }} />);
    expect(screen.getByRole('columnheader', { name: 'Contato' })).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('Solar Prime')).toBeInTheDocument();
  });

  it('renders actionable empty state', () => {
    render(<AudienceTable data={{ total_count: 0, page: 1, per_page: 20, total_pages: 0, sample_contacts: [] }} />);
    expect(screen.getByText('Nenhum contato encontrado')).toBeInTheDocument();
  });
});
