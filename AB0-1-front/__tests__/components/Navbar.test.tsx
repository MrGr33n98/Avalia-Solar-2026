import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/lib/api';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: Object.assign(
    ({ src, alt, width, height, ...props }: { src: string; alt: string; width?: number; height?: number }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={width} height={height} {...props} data-testid="mock-image" />
    ),
    { displayName: 'MockNextImage' }
  ),
}));

// Mock the next/link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: Object.assign(
    ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
      <a href={href} onClick={(e) => e.preventDefault()} {...props}>{children}</a>
    ),
    { displayName: 'MockNextLink' }
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

const mockUsePathname = jest.fn(() => '/');

// Mock the useRouter hook from next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
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
jest.mock('@/components/LocationSearch', () =>
  Object.assign(
    (props: { className?: string; onLocationSelect?: (location: { state: string; city: string }) => void }) => (
      <div data-testid="location-search" className={props.className}>
        <button onClick={() => props.onLocationSelect?.({ state: 'SP', city: 'São Paulo' })}>
          Select Location
        </button>
      </div>
    ),
    { displayName: 'MockLocationSearch' }
  )
);

// Mock NavbarSearch
jest.mock('@/components/NavbarSearch', () =>
  Object.assign(
    (props: { className?: string; placeholder?: string }) => (
      <div data-testid="navbar-search" className={props.className}>
        <input placeholder={props.placeholder} />
      </div>
    ),
    { displayName: 'MockNavbarSearch' }
  )
);

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    nav: Object.assign(
      ({ children, ...props }: { children: React.ReactNode }) => <nav {...props}>{children}</nav>,
      { displayName: 'MockMotionNav' }
    ),
    div: Object.assign(
      ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
      { displayName: 'MockMotionDiv' }
    ),
  },
  AnimatePresence: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    { displayName: 'MockAnimatePresence' }
  ),
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
    expect(logo).toHaveAttribute('src', '/images/avalia-solar-logo-horizontal.svg');
    
    const homeLink = screen.getByRole('link', { name: 'Home Avalia Solar' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders navigation links and new components', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conteúdo' })).toBeInTheDocument();
    
    // Check for new components
    expect(screen.getByTestId('navbar-search')).toBeInTheDocument();
    expect(screen.getAllByTestId('location-search')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Categorias/i })).toBeInTheDocument();
  });

  it('renders login and register buttons', () => {
    render(<Navbar />);

    expect(screen.getAllByRole('link', { name: 'Entrar' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: 'Para empresas' }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders public chrome outside of /dashboard', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);

    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home Avalia Solar' })).toBeInTheDocument();
  });

  it('does not render inside /dashboard routes', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Navbar />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render inside nested /dashboard routes', () => {
    mockUsePathname.mockReturnValue('/dashboard/settings');
    const { container } = render(<Navbar />);

    expect(container.firstChild).toBeNull();
  });
});
