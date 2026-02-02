import { render, screen, fireEvent, within } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/lib/api';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, fill, priority, ...props }: { src: string; alt: string; width?: number; height?: number; fill?: boolean; priority?: boolean }) => (
    // ALTERADO: Handle 'priority' prop correctly. If it's a boolean, don't pass it directly as a non-boolean attribute.
    // Or, if the component expects it, convert it to a string. For testing, often it's safe to omit or convert.
    <img src={src} alt={alt} width={width} height={height} {...props} data-testid="mock-image" />
  ),
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} onClick={(e) => e.preventDefault()} {...props}>{children}</a>
  ),
}));

// Mock the SearchBar component
jest.mock('@/components/SearchBar', () => {
  return {
    __esModule: true,
    default: ({ fullWidth, onClose }: { fullWidth?: boolean; onClose?: () => void }) => (
      <div data-testid="search-bar">
        {fullWidth && <span>Full Width Search</span>}
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    ),
  };
});

// Mock the useRouter hook from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Mock the useCategories hook
jest.mock('@/hooks/useCategories', () => ({
  __esModule: true,
  useCategories: jest.fn(),
}));

// Mock CategoriesMegaMenu
jest.mock('@/components/categories/CategoriesMegaMenu', () => ({
  CategoriesMegaMenu: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="categories-mega-menu">Mega Menu</div> : null,
}));

// Mock MobileCategoriesDrawer
jest.mock('@/components/navigation/MobileCategoriesDrawer', () => ({
  MobileCategoriesDrawer: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="mobile-categories-drawer">Mobile Drawer</div> : null,
}));

// Mock LocationSearch
jest.mock('@/components/LocationSearch', () => (props: any) => (
  <div data-testid="location-search" className={props.className}>
    <button onClick={() => props.onLocationSelect({ state: 'SP', city: 'São Paulo' })}>
      Select Location
    </button>
  </div>
));

// Mock NavbarSearch
jest.mock('@/components/NavbarSearch', () => (props: any) => (
  <div data-testid="navbar-search" className={props.className}>
    <input placeholder={props.placeholder} />
  </div>
));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

describe('Navbar', () => {
  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Painéis Solares',
      description: 'Painéis solares de alta eficiência',
      seo_url: 'painel-solar',
      featured: true,
      active: true,
    },
    {
      id: 2,
      name: 'Inversores',
      description: 'Inversores para sistemas solares',
      seo_url: 'inversor',
      featured: true,
      active: true,
    },
  ];

  beforeEach(() => {
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null,
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
    });
  });

  it('renders the logo and home link', () => {
    render(<Navbar />);
    
    const logo = screen.getByRole('img', { name: /Avalia Solar/ });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/logo.png');
    
    const homeLink = screen.getByRole('link', { name: 'Home Avalia Solar' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders navigation links and new components', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
    
    // Check for new components
    expect(screen.getByTestId('navbar-search')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Categorias/i })).toBeInTheDocument();
  });

  it('renders login and register buttons', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cadastre sua empresa' })).toBeInTheDocument();
  });
});