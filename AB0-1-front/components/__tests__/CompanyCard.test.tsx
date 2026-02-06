import { render, screen } from '@testing-library/react';
import CompanyCard from '../CompanyCard';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// Mock do router do Next.js para corrigir o erro "invariant" nos testes
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

const company = {
  id: 1,
  name: 'GoodWe',
  city: 'São Paulo',
  state: 'SP',
  description: 'Solar inverter manufacturer',
  rating_count: 0,
  average_rating: 0,
} as any;

describe('CompanyCard', () => {
  it('renders company name and location', () => {
    render(<CompanyCard company={company} />);
    expect(screen.getByText('GoodWe')).toBeInTheDocument();
    expect(screen.getByText(/São Paulo/)).toBeInTheDocument();
  });
});
