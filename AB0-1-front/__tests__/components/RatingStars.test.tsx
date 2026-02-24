import { render, screen } from '@testing-library/react';
import { RatingStars } from '@/components/RatingStars';

jest.mock('lucide-react', () => ({
  Star: (props: any) => <svg data-testid="star-icon" className={props.className} />,
  StarHalf: (props: any) => <svg data-testid="star-half-icon" className={props.className} />,
}));

describe('RatingStars', () => {
  it('does not crash when rating is NaN', () => {
    render(<RatingStars rating={Number.NaN as unknown as number} showRatingValue />);

    const stars = screen.getAllByTestId('star-icon');
    const emptyStars = stars.filter((star) => star.getAttribute('class')?.includes('text-gray-200'));

    expect(stars).toHaveLength(5);
    expect(emptyStars).toHaveLength(5);
    expect(screen.queryByTestId('star-half-icon')).not.toBeInTheDocument();
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('clamps rating and count to safe bounds', () => {
    render(<RatingStars rating={8 as unknown as number} count={12.8 as unknown as number} showCount />);

    const stars = screen.getAllByTestId('star-icon');
    const fullStars = stars.filter((star) => star.getAttribute('class')?.includes('fill-yellow-400'));

    expect(stars).toHaveLength(5);
    expect(fullStars).toHaveLength(5);
    expect(screen.getByText('(12)')).toBeInTheDocument();
  });
});
