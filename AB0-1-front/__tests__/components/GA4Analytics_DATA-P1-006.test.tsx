
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import CompanyCard from '@/components/CompanyCard';
import ProductCard from '@/components/ProductCard';
import { track as trackLazy } from '@/lib/analytics/lazy';
import { track as trackMain } from '@/lib/analytics';
import React from 'react';
import { useLeadWizard } from '../../src/modules/leadWizard/hooks/useLeadWizard';
import { wizardApi } from '../../src/modules/leadWizard/api/wizard.api';

// Consolidated Analytics Mock
jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({
  track: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock IntersectionObserver
window.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: (node: any) => {
    callback([{ isIntersecting: true }], { disconnect: jest.fn() });
  },
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock wizardApi
jest.mock('../../src/modules/leadWizard/api/wizard.api', () => ({
  wizardApi: {
    resolveSchema: jest.fn(),
    submitLead: jest.fn(),
  },
}));

describe('GA4 Analytics DATA-P1-006 - CompanyCard', () => {
  const mockCompany = {
    id: 123,
    name: 'Solar Tech',
    slug: 'solar-tech',
    active_admin: true,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track company_card_impression on mount', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(trackLazy).toHaveBeenCalledWith('company_card_impression', expect.objectContaining({
      company_id: 123
    }));
  });

  it('should track company_cta_impression when CTA section is visible', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(trackLazy).toHaveBeenCalledWith('company_cta_impression', expect.objectContaining({
      company_id: 123
    }));
  });
});

describe('GA4 Analytics DATA-P1-006 - ProductCard', () => {
  const mockProduct = {
    id: 456,
    name: 'Painel 550W',
    company: { id: 123, name: 'Solar Tech' },
    price: 1000,
    status: 'active'
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track product_impression when visible', () => {
    render(<ProductCard product={mockProduct} />);
    expect(trackLazy).toHaveBeenCalledWith('product_impression', expect.objectContaining({
      product_id: 456
    }));
  });

  it('should track product_click when details button is clicked', () => {
    render(<ProductCard product={mockProduct} />);
    const detailsLink = screen.getByText('Detalhes');
    fireEvent.click(detailsLink);
    expect(trackLazy).toHaveBeenCalledWith('product_click', expect.objectContaining({
      product_id: 456,
      click_type: 'details'
    }));
  });
});

describe('GA4 Analytics DATA-P1-006 - useLeadWizard', () => {
  const mockSchema = {
    template_key: 'test_template',
    schema: {
      steps: [
        { title: 'Step 1', fields: [] },
        { title: 'Step 2', fields: [] }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (wizardApi.resolveSchema as jest.Mock).mockResolvedValue(mockSchema);
  });

  it('should track wizard_started and wizard_step_viewed on load', async () => {
    const { result } = renderHook(() => useLeadWizard(1));
    
    // Wait for effect
    await act(async () => {
      await Promise.resolve();
    });

    expect(trackMain).toHaveBeenCalledWith('wizard_started', expect.objectContaining({
      category_id: 1,
      template_key: 'test_template'
    }));

    expect(trackMain).toHaveBeenCalledWith('wizard_step_viewed', expect.objectContaining({
      step_index: 0,
      step_name: 'Step 1'
    }));
  });

  it('should track wizard_step_completed when nextStep is called', async () => {
    const { result } = renderHook(() => useLeadWizard(1));
    
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.nextStep();
    });

    expect(trackMain).toHaveBeenCalledWith('wizard_step_completed', expect.objectContaining({
      step_index: 0
    }));

    expect(trackMain).toHaveBeenCalledWith('wizard_step_viewed', expect.objectContaining({
      step_index: 1,
      step_name: 'Step 2'
    }));
  });
});
