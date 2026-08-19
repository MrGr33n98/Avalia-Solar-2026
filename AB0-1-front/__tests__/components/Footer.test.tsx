import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Footer', () => {
  it('renders the company name', () => {
    render(<Footer />);

    expect(screen.getByText('Avalia Solar')).toBeInTheDocument();
  });

  it('renders company contact information', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Fale com Felipe' })).toHaveAttribute(
      'href',
      'mailto:felipe@avaliasolar.com.br'
    );
    expect(screen.getByRole('link', { name: 'Fale com a equipe' })).toHaveAttribute(
      'href',
      'mailto:felipe@avaliasolar.com.br'
    );
    expect(screen.getByRole('link', { name: '+55 65 9346-5055' })).toHaveAttribute(
      'href',
      'tel:+556593465055'
    );
  });

  it('renders company links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Sobre a Avalia Solar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carreiras' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Contato oficial' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Central de ajuda' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sala de imprensa' })).toBeInTheDocument();
  });

  it('renders legal links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Termos de uso' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cookies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'DMCA' })).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<Footer />);

    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    expect(screen.queryByLabelText('Facebook')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Twitter')).not.toBeInTheDocument();
  });

  it('renders copyright information', () => {
    render(<Footer />);

    expect(
      screen.getByText(/© 2026 Avalia Solar. Todos os direitos reservados./)
    ).toBeInTheDocument();
  });

  it('renders the home link', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Avalia Solar' })).toHaveAttribute('href', '/');
  });
});
