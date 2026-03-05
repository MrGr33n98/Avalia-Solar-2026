import { render, screen } from '@testing-library/react';
import { QuotesPanel } from '../app/review-dashboard/components/QuotesPanel';
import { Lead } from '../lib/api';

// Mock data for testing
const createMockLead = (company: any): Lead => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '+55 11 99999-9999',
  company,
  status: 'verified',
  category: 'energia-solar',
  product_vertical: 'Energia Solar',
  created_at: new Date().toISOString(),
});

describe('QuotesPanel - Company Display Fix', () => {
  it('handles company as string', () => {
    const mockLead = createMockLead('Solar Company Inc');
    
    render(
      <QuotesPanel 
        data={[mockLead]} 
        loading={false}
        onViewDetails={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    // Should display company name correctly
    expect(screen.getByText('Solar Company Inc')).toBeInTheDocument();
    
    // Should display correct initials (first 2 characters)
    expect(screen.getByText('SO')).toBeInTheDocument();
  });
  
  it('handles company as object', () => {
    const mockLead = createMockLead({
      id: 123,
      name: 'Energy Solutions Ltd',
      logo_url: 'https://example.com/logo.png'
    });
    
    render(
      <QuotesPanel 
        data={[mockLead]} 
        loading={false}
        onViewDetails={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    // Should display company name from object
    expect(screen.getByText('Energy Solutions Ltd')).toBeInTheDocument();
    
    // Should display correct initials from object name
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
  
  it('handles empty company gracefully', () => {
    const mockLead = createMockLead(null);
    
    render(
      <QuotesPanel 
        data={[mockLead]} 
        loading={false}
        onViewDetails={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    // Should display fallback text
    expect(screen.getByText('Empresa não identificada')).toBeInTheDocument();
    
    // Should display fallback initials (EM from "Empresa")
    expect(screen.getByText('EM')).toBeInTheDocument();
  });
  
  it('handles malformed company object', () => {
    const mockLead = createMockLead({ id: 456 }); // Missing name
    
    render(
      <QuotesPanel 
        data={[mockLead]} 
        loading={false}
        onViewDetails={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    
    // Should display fallback text when name is missing
    expect(screen.getByText('Empresa não identificada')).toBeInTheDocument();
    
    // Should display fallback initials (EM from "Empresa")
    expect(screen.getByText('EM')).toBeInTheDocument();
  });
});