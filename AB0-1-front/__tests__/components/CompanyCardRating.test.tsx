import { render, screen } from '@testing-library/react';
import CompanyCard from '@/components/CompanyCard';
import { Company } from '@/lib/api';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock hooks
jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: jest.fn(),
    toggleFavorite: jest.fn(),
  }),
}));

jest.mock('@/hooks/useComparison', () => ({
  useComparison: () => ({
    isInComparison: jest.fn(),
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
  }),
}));

// Mock lucide-react icons - Passing props to allow class checking
jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" className={props.className} />,
  StarHalf: (props: any) => <svg data-testid="star-half-icon" className={props.className} />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
  MessageCircle: () => <svg data-testid="message-circle-icon" />,
  Building2: () => <svg data-testid="building-icon" />,
  Share2: () => <svg data-testid="share-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  Scale: () => <svg data-testid="scale-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
}));

describe('CompanyCard - Rating and Reviews', () => {
  const baseCompany: Company = {
    id: 1,
    name: 'Solar Test',
    slug: 'solar-test',
    average_rating: 0,
    rating_count: 0,
    city: 'São Paulo',
    state: 'SP',
  };

  it('calculates full and empty stars correctly for integer rating', () => {
    const company = { ...baseCompany, average_rating: 4, rating_count: 10 };
    render(<CompanyCard company={company} />);
    
    const stars = screen.getAllByTestId('star-icon');
    // Rating stars have fill-[#ff4d4d] or text-gray-200. Review button star has text-gray-400.
    const fullStars = stars.filter(s => s.getAttribute('class')?.includes('fill-[#ff4d4d]'));
    const emptyStars = stars.filter(s => s.getAttribute('class')?.includes('text-gray-200'));
    
    expect(fullStars).toHaveLength(4);
    expect(emptyStars).toHaveLength(1);
    expect(screen.queryByTestId('star-half-icon')).not.toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('calculates half stars correctly for fractional rating', () => {
    const company = { ...baseCompany, average_rating: 3.5, rating_count: 5 };
    render(<CompanyCard company={company} />);
    
    const stars = screen.getAllByTestId('star-icon');
    const fullStars = stars.filter(s => s.getAttribute('class')?.includes('fill-[#ff4d4d]'));
    const emptyStars = stars.filter(s => s.getAttribute('class')?.includes('text-gray-200'));
    
    expect(fullStars).toHaveLength(3);
    expect(screen.getByTestId('star-half-icon')).toBeInTheDocument();
    expect(emptyStars).toHaveLength(1);
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('handles zero rating correctly', () => {
    const company = { ...baseCompany, average_rating: 0, rating_count: 0 };
    render(<CompanyCard company={company} />);
    
    const stars = screen.getAllByTestId('star-icon');
    // Now we expect 5 empty stars even for zero rating, plus the one in the button
    const ratingStars = stars.filter(s => s.getAttribute('class')?.includes('fill-[#ff4d4d]') || s.getAttribute('class')?.includes('text-gray-200'));
    const emptyRatingStars = stars.filter(s => s.getAttribute('class')?.includes('text-gray-200'));
    
    expect(ratingStars).toHaveLength(5);
    expect(emptyRatingStars).toHaveLength(5);
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  it('handles high rating correctly (5 stars)', () => {
    const company = { ...baseCompany, average_rating: 5, rating_count: 100 };
    render(<CompanyCard company={company} />);
    
    const stars = screen.getAllByTestId('star-icon');
    const fullStars = stars.filter(s => s.getAttribute('class')?.includes('fill-[#ff4d4d]'));
    
    expect(fullStars).toHaveLength(5);
    expect(screen.queryByTestId('star-half-icon')).not.toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });
});
