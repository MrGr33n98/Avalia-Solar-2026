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
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} onClick={(e) => e.preventDefault()}>{children}</a>
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

// Mock the CategoryDropdownItem component
jest.mock('@/components/CategoryDropdownItem', () => {
  return {
    __esModule: true,
    default: ({ category, onSelect }: { category: any; onSelect: () => void }) => (
      <a href={`/categories/${category.seo_url || category.id}`} onClick={onSelect}>
        {category.name}
      </a>
    ),
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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
  });

  it('renders the logo and home link', () => {
    render(<Navbar />);
    
    const logo = screen.getByRole('img', { name: /Avalia Solar/ });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/logo.png');
    
    // O link tem tanto a imagem quanto o texto "Avalia Solar", então o nome completo é "Avalia Solar Avalia Solar"
    const homeLink = screen.getByRole('link', { name: 'Avalia Solar Avalia Solar' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    
    expect(screen.getByRole('link', { name: 'Empresas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Produtos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Planos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reviews' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders login and register buttons', () => {
    render(<Navbar />);
    
    // Login e Registrar são links (elementos <a>), não botões
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar' })).toBeInTheDocument();
  });

  it('renders categories dropdown with category items', async () => {
    render(<Navbar />);
    
    const categoriesButton = screen.getByRole('button', { name: /Categorias/ });
    expect(categoriesButton).toBeInTheDocument();
    
    // Simular clique para abrir o dropdown
    fireEvent.click(categoriesButton);
    
    // Aguardar que o dropdown apareça
    await screen.findByRole('link', { name: 'Painéis Solares' });
    
    // Check that category links appear
    expect(screen.getByRole('link', { name: 'Painéis Solares' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inversores' })).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', async () => {
    // Resize window to mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });
    window.dispatchEvent(new Event('resize'));

    render(<Navbar />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    // Aguardar que o menu móvel apareça
    const mobileMenu = await screen.findByTestId('mobile-menu');

    // Use within to find elements inside the mobile menu
    expect(within(mobileMenu).getByText(/Empresas/i)).toBeInTheDocument();
    expect(within(mobileMenu).getByText(/Produtos/i)).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: 'Planos' })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: 'Reviews' })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(within(mobileMenu).getByRole('link', { name: 'Registrar' })).toBeInTheDocument();
  });

  it('shows loading state when categories are loading', () => {
    (useCategories as jest.Mock).mockReturnValue({
      categories: [],
      loading: true,
      error: null,
    });

    render(<Navbar />);
    
    const categoriesButton = screen.getByRole('button', { name: /Categorias/ });
    fireEvent.click(categoriesButton);
    
    // The dropdown shouldn't appear when loading
    expect(screen.queryByRole('link', { name: 'Painéis Solares' })).not.toBeInTheDocument();
  });

  it('handles error state when categories have an error', () => {
    (useCategories as jest.Mock).mockReturnValue({
      categories: [],
      loading: false,
      error: new Error('Failed to load categories'),
    });

    render(<Navbar />);
    
    const categoriesButton = screen.getByRole('button', { name: /Categorias/ });
    fireEvent.click(categoriesButton);
    
    // The dropdown shouldn't appear when there's an error
    expect(screen.queryByRole('link', { name: 'Painéis Solares' })).not.toBeInTheDocument();
  });
});