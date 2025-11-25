import { render, screen, waitFor } from '@testing-library/react';
import * as HomeModule from '@/app/page';
import { Category, Company, Review } from '@/lib/api'; // Import Category, Company, and Review types
import { categoriesApiSafe, companiesApiSafe, reviewsApiSafe } from '@/lib/api-client'; // Import API clients
import React from 'react'; // ADDED: Import React for React.cloneElement

// Access the default exported component
const Home = HomeModule.default;

// Mock the API client modules
jest.mock('@/lib/api-client', () => ({
  categoriesApiSafe: {
    getAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'Featured Category', slug: 'featured-category', banner_url: '/banner1.jpg', featured: true, active: true },
      { id: 2, name: 'Category 1', slug: 'category-1', banner_url: '/banner2.jpg', featured: false, active: true },
      { id: 3, name: 'Inactive Category', slug: 'inactive-category', banner_url: '/banner3.jpg', featured: true, active: false },
    ]),
  },
  companiesApiSafe: {
    getAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'Company 1', slug: 'company-1', logo_url: '/logo1.png', banner_url: '/banner1.jpg', description: 'Desc 1', average_rating: 4.5, rating_count: 10, city: 'City A', state: 'ST' },
      { id: 2, name: 'Company 2', slug: 'company-2', logo_url: '/logo2.png', banner_url: '/banner2.jpg', description: 'Desc 2', average_rating: 3.8, rating_count: 5, city: 'City B', state: 'ST' },
    ]),
  },
  reviewsApiSafe: {
    getAll: jest.fn().mockResolvedValue([
      { id: 1, company_id: 1, rating: 5, comment: 'Great service!', user_name: 'User A' },
      { id: 2, company_id: 2, rating: 4, comment: 'Good experience.', user_name: 'User B' },
    ]),
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock lucide-react icons (if used in Home component directly)
jest.mock('lucide-react', () => ({
  Star: () => <svg data-testid="star-icon" />,
  MapPin: () => <div data-testid="map-pin-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
}));

// Mock the Hero component
jest.mock('@/components/Hero', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="mock-hero">Mock Hero Component</div>,
  };
});

// Mock the Navbar component
jest.mock('@/components/Navbar', () => {
  return {
    __esModule: true,
    default: () => <nav data-testid="mock-navbar">Mock Navbar</nav>,
  };
});

// Mock the CategoryCard component
jest.mock('@/components/CategoryCard', () => {
  return {
    __esModule: true,
    default: ({ category }: { category: any }) => <div data-testid={`mock-category-card-${category.id}`}>{category.name}</div>,
  };
});

// Mock the CompanyCard component
jest.mock('@/components/CompanyCard', () => {
  return {
    __esModule: true,
    default: ({ company }: { company: any }) => <div data-testid={`mock-company-card-${company.id}`}>{company.name}</div>,
  };
});

// Mock the StarRating component
jest.mock('@/components/StarRating', () => {
  return {
    __esModule: true,
    default: ({ rating }: { rating: number }) => <div data-testid="mock-star-rating">{rating}</div>,
  };
});

// Mock the Footer component
jest.mock('@/components/Footer', () => {
  return {
    __esModule: true,
    default: () => <footer data-testid="mock-footer">Mock Footer</footer>,
  };
});

// Mock common UI components from ui/
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      // If asChild is true, render children directly and pass props to them
      // This assumes children is a single React element
      return React.cloneElement(children, props);
    }
    return <button {...props} data-testid="mock-button">{children}</button>;
  },
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props} data-testid="mock-card">{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props} data-testid="mock-card-content">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props} data-testid="mock-badge">{children}</span>,
}));

jest.mock('@/components/ui/Skeleton', () => ({
  __esModule: true,
  default: ({ className, 'data-testid': dataTestId }: { className?: string; 'data-testid'?: string }) => <div data-testid={dataTestId || "mock-skeleton"} className={className} />,
}));


describe('Home Page', () => {
  beforeEach(() => {
    // Clear mocks before each test
    (categoriesApiSafe.getAll as jest.Mock).mockClear();
    (companiesApiSafe.getAll as jest.Mock).mockClear();
    (reviewsApiSafe.getAll as jest.Mock).mockClear();
  });

  it('renders featured categories and companies', async () => {
    render(<Home />);

    // Check for mock components
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

    // Check for featured categories
    await waitFor(() => {
      expect(categoriesApiSafe.getAll).toHaveBeenCalledTimes(1);
      // Now we expect the mock CategoryCard to render the name
      expect(screen.getByTestId('mock-category-card-1')).toHaveTextContent('Featured Category');
      expect(screen.queryByTestId('mock-category-card-2')).not.toBeInTheDocument(); // Only featured should be shown
    });

    // Check for companies
    await waitFor(() => {
      expect(companiesApiSafe.getAll).toHaveBeenCalledTimes(1);
      // Now we expect the mock CompanyCard to render the name
      expect(screen.getByTestId('mock-company-card-1')).toHaveTextContent('Company 1');
      expect(screen.getByTestId('mock-company-card-2')).toHaveTextContent('Company 2');
    });

    // Check for reviews (if rendered directly, otherwise this might be in a sub-component)
    await waitFor(() => {
      expect(reviewsApiSafe.getAll).toHaveBeenCalledTimes(1);
      // Assuming reviews are displayed in some form
      // expect(screen.getByText('Great service!')).toBeInTheDocument();
    });
  });

  it('displays error message if categories fail to load', async () => {
    (categoriesApiSafe.getAll as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch categories'));
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar categorias.')).toBeInTheDocument();
    });
  });

  it('displays error message if companies fail to load', async () => {
    (companiesApiSafe.getAll as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch companies'));
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar empresas.')).toBeInTheDocument();
    });
  });

  // Skipping this test as the reviews section is currently commented out in the Home page
  // it('displays error message if reviews fail to load', async () => {
  //   (reviewsApiSafe.getAll as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch reviews'));
  //   render(<Home />);
  //   await waitFor(() => {
  //     expect(screen.getByText('Erro ao carregar avaliações.')).toBeInTheDocument();
  //   });
  // });
});