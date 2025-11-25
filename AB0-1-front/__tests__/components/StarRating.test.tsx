import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '@/components/StarRating';

// Mock the Star icon from lucide-react to include data-testid
jest.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="star-icon">Mock Star</svg>
  ),
}));

describe('StarRating', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders 5 stars', () => {
    render(<StarRating value={0} onChange={mockOnChange} />);
    
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('fills stars up to the current value', () => {
    render(<StarRating value={3} onChange={mockOnChange} />);
    
    const allStars = screen.getAllByRole('button');
    // Get the SVG icons inside the buttons
    const icons = screen.getAllByTestId('star-icon');
    
    // First 3 icons should be filled (have fill-current class)
    expect(icons[0]).toHaveClass('fill-current');
    expect(icons[1]).toHaveClass('fill-current');
    expect(icons[2]).toHaveClass('fill-current');
    // Last 2 icons should be empty (have fill-transparent class)
    expect(icons[3]).toHaveClass('fill-transparent');
    expect(icons[4]).toHaveClass('fill-transparent');
  });

  it('calls onChange with the correct rating when a star is clicked', () => {
    render(<StarRating value={0} onChange={mockOnChange} />);
    
    const thirdStar = screen.getAllByRole('button')[2]; // Third star
    fireEvent.click(thirdStar);
    
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('has the correct accessibility attributes', () => {
    render(<StarRating value={0} onChange={mockOnChange} />);
    
    const stars = screen.getAllByRole('button');
    stars.forEach(star => {
      expect(star).toHaveClass('text-yellow-400');
    });
  });

  it('shows correct star state for different ratings', () => {
    const { rerender } = render(<StarRating value={1} onChange={mockOnChange} />);
    
    let icons = screen.getAllByTestId('star-icon');
    // First icon should be filled
    expect(icons[0]).toHaveClass('fill-current');
    // Remaining icons should be empty
    for (let i = 1; i < 5; i++) {
      expect(icons[i]).toHaveClass('fill-transparent');
    }
    
    rerender(<StarRating value={4} onChange={mockOnChange} />);
    
    icons = screen.getAllByTestId('star-icon');
    // First 4 icons should be filled
    for (let i = 0; i < 4; i++) {
      expect(icons[i]).toHaveClass('fill-current');
    }
    // Last icon should be empty
    expect(icons[4]).toHaveClass('fill-transparent');
  });
});