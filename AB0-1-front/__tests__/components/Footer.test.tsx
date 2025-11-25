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
    
    expect(screen.getByText('Compare Solar')).toBeInTheDocument();
  });

  it('renders company contact information', () => {
    render(<Footer />);
    
    expect(screen.getByText('contato@comparesolar.com.br')).toBeInTheDocument();
    expect(screen.getByText('(65) 99242-3309')).toBeInTheDocument();
    expect(screen.getByText('Florianópolis, SC')).toBeInTheDocument();
  });

  it('renders company links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Sobre Nós' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carreiras' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Imprensa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Centro de Ajuda' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contato' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'API Docs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Status' })).toBeInTheDocument();
  });

  it('renders legal links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Termos de Uso' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Cookies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'DMCA' })).toBeInTheDocument();
  });

  it('renders social media links', () => {
    render(<Footer />);
    
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
  });

  it('renders copyright information', () => {
    render(<Footer />);
    
    expect(screen.getByText(/© 2025 Compare Solar. Todos os direitos reservados./)).toBeInTheDocument();
  });

  it('renders the home link', () => {
    render(<Footer />);
    
    expect(screen.getByRole('link', { name: 'Compare Solar' })).toHaveAttribute('href', '/');
  });
});