import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer', () => {
  it('renders the strategic navigation and priority cities', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo', { name: 'Rodapé' })).toBeInTheDocument();
    expect(screen.getAllByText('Energia solar por cidade')).toHaveLength(2);

    const cityLinks = screen.getByRole('list', { name: 'Energia solar por cidade' });
    const links = Array.from(cityLinks.querySelectorAll('a')).map((link) =>
      link.textContent?.trim()
    );

    expect(links.slice(0, 6)).toEqual([
      'Energia solar em Florianópolis',
      'Energia solar em São Paulo',
      'Energia solar em Belo Horizonte',
      'Energia solar em Curitiba',
      'Energia solar em Brasília',
      'Energia solar em Goiânia',
    ]);
  });

  it('uses canonical, parameter-free links for discovery navigation', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo', { name: 'Rodapé' });
    const hrefs = Array.from(footer.querySelectorAll('a')).map((link) => link.getAttribute('href'));

    expect(hrefs).not.toContain(null);
    expect(hrefs.some((href) => href?.startsWith('/') && href.includes('?'))).toBe(false);
  });
});
