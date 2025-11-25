import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

// Mock the hooks used in the component
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}));

jest.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    stats: {
      companies_count: 500,
      average_rating: 4.8,
      projects_count: 10, // Changed to match the expected format (10k+)
    },
    loading: false,
  }),
}));

// Mock the motion component to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Hero', () => {
  it('renders the main heading and subheading', () => {
    render(<Hero />);
    
    expect(screen.getByText(/Compare e Encontre a/)).toBeInTheDocument();
    expect(screen.getByText(/Melhor Empresa Solar/)).toBeInTheDocument();
    expect(screen.getByText(/Conecte-se com as melhores empresas de energia solar do Brasil/)).toBeInTheDocument();
  });

  it('renders the search bar with correct placeholder', () => {
    render(<Hero />);
    
    expect(screen.getByPlaceholderText(/Busque empresas, produtos ou serviços/)).toBeInTheDocument();
  });

  it('renders the search tags', () => {
    render(<Hero />);
    
    expect(screen.getByText('Painel Solar')).toBeInTheDocument();
    expect(screen.getByText('Inversor')).toBeInTheDocument();
    expect(screen.getByText('Bateria')).toBeInTheDocument();
    expect(screen.getByText('Instalação')).toBeInTheDocument();
  });

  it('renders CTA buttons for unauthenticated users', () => {
    render(<Hero />);
    
    expect(screen.getByText('Começar Agora')).toBeInTheDocument();
    expect(screen.getByText('Já tenho conta')).toBeInTheDocument();
  });

  it('renders stats with correct values', () => {
    render(<Hero />);
    
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('4.8/5')).toBeInTheDocument();
    // The component shows projects_count as is followed by 'k+', so with value 10 it would be '10k+'
    expect(screen.getByText('10k+')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});