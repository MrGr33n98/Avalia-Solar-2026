import React from 'react';
import { render, screen } from '@testing-library/react';
import NavbarBannerSlot from '@/components/NavbarBannerSlot';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/components/BannerByLocation', () => {
  return function MockBanner() {
    return <div data-testid="navbar-banner-mock">Banner Mock</div>;
  };
});

describe('NavbarBannerSlot (Spec 022 D6)', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('não renderiza no /dashboard nem em subrotas do dashboard', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    const { container, rerender } = render(<NavbarBannerSlot />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('navbar-banner-mock')).not.toBeInTheDocument();

    (usePathname as jest.Mock).mockReturnValue('/dashboard/sales');
    rerender(<NavbarBannerSlot />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza na homepage nem no review-dashboard', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { container, rerender } = render(<NavbarBannerSlot />);
    expect(container).toBeEmptyDOMElement();

    (usePathname as jest.Mock).mockReturnValue('/review-dashboard');
    rerender(<NavbarBannerSlot />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza em rotas públicas como /companies', () => {
    (usePathname as jest.Mock).mockReturnValue('/companies');
    render(<NavbarBannerSlot />);
    expect(screen.getByTestId('navbar-banner-mock')).toBeInTheDocument();
  });
});
