import { render, screen } from '@testing-library/react';
import { EnterpriseSearchPagination } from './EnterpriseSearchPagination';

describe('EnterpriseSearchPagination', () => {
  const props = {
    page: 11,
    totalPages: 20,
    totalCount: 473,
    perPage: 24,
    hrefForPage: (page: number) => '/search?tab=companies&verified=true&page=' + page,
    onPageSizeChange: jest.fn(),
  };

  it('keeps actual shareable URLs and accessible current page', () => {
    render(<EnterpriseSearchPagination {...props} />);
    expect(
      screen.getByText((_, element) => element?.textContent === 'Mostrando 241–264 de 473 empresas')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Página 11' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Próxima página' })).toHaveAttribute(
      'href',
      '/search?tab=companies&verified=true&page=12'
    );
    expect(screen.queryByRole('link', { name: 'Página 6' })).not.toBeInTheDocument();
  });

  it('uses a compact summary on mobile and handles empty results', () => {
    render(<EnterpriseSearchPagination {...props} page={1} totalPages={1} totalCount={0} />);
    expect(screen.getByText('Nenhuma empresa encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Página 2' })).not.toBeInTheDocument();
  });
});
