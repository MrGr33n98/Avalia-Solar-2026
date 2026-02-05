
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CategoryCard from '@/components/CategoryCard';
import CompanyHero from '@/app/companies/[id]/components/CompanyHero';
import { track } from '@/lib/analytics/lazy';
import '@testing-library/jest-dom';

// Mock analytics
jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Analytics Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock navigator APIs
    Object.defineProperty(window, 'navigator', {
      value: {
        share: jest.fn(),
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    });
  });

  describe('CategoryCard Analytics', () => {
    const mockCategory = {
      id: 1,
      name: 'Painéis Solares',
      seo_url: 'paineis-solares',
      description: 'Descrição teste',
      companies_count: 10,
      average_rating: 4.5,
    } as any;

    it('should track category_card_click when clicked', () => {
      render(<CategoryCard category={mockCategory} />);
      
      const link = screen.getByRole('link');
      fireEvent.click(link);
      
      expect(track).toHaveBeenCalledWith('category_card_click', expect.objectContaining({
        category_id: 1,
        category_name: 'Painéis Solares',
        element_type: 'card',
        action_type: 'click',
      }));
    });

    it('should track category_card_hover when hovered', () => {
      render(<CategoryCard category={mockCategory} />);
      
      const card = screen.getByText('Painéis Solares').closest('.rounded-xl');
      if (card) {
        fireEvent.mouseEnter(card);
        
        expect(track).toHaveBeenCalledWith('category_card_hover', expect.objectContaining({
          category_id: 1,
          category_name: 'Painéis Solares',
          element_type: 'card',
          action_type: 'hover',
        }));
      }
    });
  });

  describe('CompanyHero Analytics', () => {
    const mockCompany = {
      id: 123,
      name: 'Solar Tech',
      description: 'Empresa de tecnologia solar',
      verified: true,
    } as any;

    const mockStats = {
      rating: 4.8,
      reviewCount: 150,
    };

    it('should track company_share_click when share button is clicked', async () => {
      render(
        <CompanyHero 
          company={mockCompany} 
          companyStats={mockStats}
          bannerUrl={null}
          bannerError={false}
          setBannerError={() => {}}
          logoUrl={null}
          logoError={false}
          setLogoError={() => {}}
          ctaEnabled={true}
          ctaUrl={null}
        />
      );
      
      const shareButton = screen.getByTitle('Compartilhar perfil');
      await act(async () => {
        fireEvent.click(shareButton);
      });
      
      expect(track).toHaveBeenCalledWith('company_share_click', expect.objectContaining({
        company_id: 123,
        company_name: 'Solar Tech',
        element_type: 'button',
        action_type: 'click',
      }));
    });

    it('should track company_back_click when back button is clicked', () => {
      render(
        <CompanyHero 
          company={mockCompany} 
          companyStats={mockStats}
          bannerUrl={null}
          bannerError={false}
          setBannerError={() => {}}
          logoUrl={null}
          logoError={false}
          setLogoError={() => {}}
          ctaEnabled={true}
          ctaUrl={null}
        />
      );
      
      const backButton = screen.getByText('Voltar');
      fireEvent.click(backButton);
      
      expect(track).toHaveBeenCalledWith('company_back_click', expect.objectContaining({
        company_id: 123,
        company_name: 'Solar Tech',
        element_type: 'button',
        action_type: 'click',
      }));
    });
  });
});
