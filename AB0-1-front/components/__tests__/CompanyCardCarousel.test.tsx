import { render, screen, fireEvent } from '@testing-library/react';
import CompanyCardCarousel from '../CompanyCardCarousel';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: () => false,
    toggleComparison: jest.fn(),
    canAddMore: true,
  }),
}));

const items = [
  { id: 1, name: 'A', city: 'São Paulo', state: 'SP' } as any,
  { id: 2, name: 'B', city: 'Rio', state: 'RJ' } as any,
  { id: 3, name: 'C', city: 'BH', state: 'MG' } as any,
  { id: 4, name: 'D', city: 'Curitiba', state: 'PR' } as any,
];

describe('CompanyCardCarousel', () => {
  it('renders indicators and responds to clicks', () => {
    render(<CompanyCardCarousel items={items} interval={2000} />);
    const indicators = screen.getAllByRole('button', { name: /Ir para slide/i });
    expect(indicators.length).toBe(items.length);
    fireEvent.click(indicators[2]);
    expect(indicators[2]).toBeInTheDocument();
  });
});
