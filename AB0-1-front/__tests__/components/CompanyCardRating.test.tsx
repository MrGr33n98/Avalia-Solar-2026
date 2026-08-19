import { render, screen, within } from '@testing-library/react';
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
    isInComparison: comparisonState.isInComparison,
    addToComparison: jest.fn(),
    removeFromComparison: jest.fn(),
    toggleComparison: comparisonState.toggleComparison,
    canAddMore: true,
  }),
}));

const comparisonState = {
  isInComparison: jest.fn().mockReturnValue(false),
  toggleComparison: jest.fn(),
};

// Mock lucide-react icons - Passing props to allow class checking
jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" className={props.className} />,
  StarHalf: (props: any) => <svg data-testid="star-half-icon" className={props.className} />,
  MapPin: () => <svg data-testid="map-pin-icon" />,
  MessageCircle: () => <svg data-testid="message-circle-icon" />,
  Building: () => <svg data-testid="building-icon" />,
  Share2: () => <svg data-testid="share-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  ArrowLeftRight: () => <svg data-testid="scale-icon" />,
  MessageSquare: () => <svg data-testid="message-square-icon" />,
  Info: () => <svg data-testid="info-icon" />,
  Trophy: () => <svg data-testid="trophy-icon" />,
  ShieldCheck: () => <svg data-testid="shield-check-icon" />,
  Zap: () => <svg data-testid="zap-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  HelpCircle: () => <svg data-testid="help-circle-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  PhoneCall: () => <svg data-testid="phone-call-icon" />,
  BadgeCheck: () => <svg data-testid="badge-check-icon" />,
  CheckCircle: () => <svg data-testid="check-circle-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  User: () => <svg data-testid="user-icon" />,
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
    render(<CompanyCard company={company} variant="standard" />);

    const container = screen.getByTestId('rating-stars-container');
    const stars = within(container).getAllByTestId('star-icon');
    const fullStars = stars.filter((s) => s.getAttribute('class')?.includes('fill-amber-400'));
    const emptyStars = stars.filter((s) => s.getAttribute('class')?.includes('text-slate-200'));

    expect(fullStars).toHaveLength(4);
    expect(emptyStars).toHaveLength(1);
    expect(screen.queryByTestId('star-half-icon')).not.toBeInTheDocument();
    expect(screen.getByText(/10\s*avaliações/)).toBeInTheDocument();
  });

  it('calculates half stars correctly for fractional rating', () => {
    const company = { ...baseCompany, average_rating: 3.5, rating_count: 5 };
    render(<CompanyCard company={company} variant="standard" />);

    const container = screen.getByTestId('rating-stars-container');
    const stars = within(container).getAllByTestId('star-icon');
    const fullStars = stars.filter((s) => s.getAttribute('class')?.includes('fill-amber-400'));
    const emptyStars = stars.filter((s) => s.getAttribute('class')?.includes('text-slate-200'));

    // As it uses Math.floor, 3.5 gives 3 full stars and 2 empty stars
    expect(fullStars).toHaveLength(3);
    expect(emptyStars).toHaveLength(2);
    expect(screen.getByText(/5\s*avaliações/)).toBeInTheDocument();
  });

  it('handles zero rating correctly', () => {
    render(<CompanyCard company={baseCompany} variant="standard" />);

    // The reputation panel (which contains 5 stars) shouldn't be rendered if rating_count is 0
    expect(screen.queryByTestId('rating-stars-container')).not.toBeInTheDocument();

    // It should render the single star in the header
    const stars = screen.getAllByTestId('star-icon');
    const headerStars = stars.filter(
      (s) =>
        s.getAttribute('class')?.includes('amber') || s.getAttribute('class')?.includes('slate')
    );
    expect(headerStars).toHaveLength(1);

    // Header should say 0 aval.
    expect(screen.getByText(/0\s*aval\./)).toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('handles high rating correctly (5 stars)', () => {
    const company = { ...baseCompany, average_rating: 5, rating_count: 100 };
    render(<CompanyCard company={company} variant="standard" />);

    const container = screen.getByTestId('rating-stars-container');
    const stars = within(container).getAllByTestId('star-icon');
    const fullStars = stars.filter((s) => s.getAttribute('class')?.includes('fill-amber-400'));

    expect(fullStars).toHaveLength(5);
    expect(screen.queryByTestId('star-half-icon')).not.toBeInTheDocument();
    expect(screen.getByText(/100\s*avaliações/)).toBeInTheDocument();
  });
});
