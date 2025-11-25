import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';

// Mock the next/image and next/link components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} data-testid="mock-image" />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Header', () => {
  it('renders the logo image with correct alt text', () => {
    render(<Header />);
    
    const logo = screen.getByRole('img', { name: /Logo/ });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/logo.png');
  });

  it('renders the link to the home page', () => {
    render(<Header />);
    
    const homeLink = screen.getByRole('link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has correct logo styling', () => {
    render(<Header />);
    
    const logo = screen.getByRole('img', { name: /Logo/ });
    expect(logo).toHaveClass('h-10');
    expect(logo).toHaveClass('w-auto');
  });
});