import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuoteDraft, NewsletterPreview, ReviewHighlights } from '../../src/blocks/CatalogPanels';
import { FavoriteCompanies, CompanyCarousel } from '../../src/blocks/DiscoveryPanels';
import { FIXTURE_INTEGRATORS } from '../../src/fixtures/staging-fixtures';

describe('catalog UI safety', () => {
  it('does not send a quote or imply newsletter subscription', () => {
    render(<><QuoteDraft /><NewsletterPreview /></>);
    fireEvent.click(screen.getByText('Revisar rascunho'));
    expect(screen.getByRole('status')).toHaveTextContent('nenhuma empresa foi contatada');
    expect(screen.getByRole('button', { name: 'Inscrição indisponível' })).toBeDisabled();
  });
  it('excludes unapproved reviews', () => {
    render(<ReviewHighlights reviews={[{ id: '1', excerpt: 'Público', approved: true }, { id: '2', excerpt: 'Privado', approved: false }]} />);
    expect(screen.getByText('Público')).toBeInTheDocument();
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });
  it('toggles a favorite locally and navigates carousel', () => {
    const companies = FIXTURE_INTEGRATORS.data.integrators;
    render(<><FavoriteCompanies companies={companies} /><CompanyCarousel companies={companies} /></>);
    fireEvent.click(screen.getAllByRole('button', { name: /Favoritar/ })[0]);
    expect(screen.getByText('Favoritos (1)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByText(companies[1].name + ' (2/' + companies.length + ')')).toBeInTheDocument();
  });
});
