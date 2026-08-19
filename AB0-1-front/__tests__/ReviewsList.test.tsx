import { render, screen } from '@testing-library/react';
import { ReviewsList } from '../app/review-dashboard/components/ReviewsList';
import { Review } from '../lib/api';

// Mock data for testing
const createMockReview = (company: any): Review => ({
  id: 1,
  rating: 5,
  comment: 'Great service!',
  company_id: 123,
  company,
  status: 'approved',
  created_at: new Date().toISOString(),
});

describe('ReviewsList - Company Display Fix', () => {
  it('handles review company as string', () => {
    const mockReview = createMockReview('Amazing Solar Corp');

    render(
      <ReviewsList data={[mockReview]} loading={false} onDelete={jest.fn()} onEdit={jest.fn()} />
    );

    // Should display company name correctly
    expect(screen.getByText('Amazing Solar Corp')).toBeInTheDocument();

    // Should display correct initials (first 2 characters)
    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('handles review company as object', () => {
    const mockReview = createMockReview({
      id: 456,
      name: 'Green Energy Solutions',
      logo_url: 'https://example.com/green-logo.png',
      slug: 'green-energy',
    });

    render(
      <ReviewsList data={[mockReview]} loading={false} onDelete={jest.fn()} onEdit={jest.fn()} />
    );

    // Should display company name from object
    expect(screen.getByText('Green Energy Solutions')).toBeInTheDocument();

    // Should display correct initials from object name
    expect(screen.getByText('GR')).toBeInTheDocument();
  });

  it('handles empty company gracefully', () => {
    const mockReview = createMockReview(null);

    render(
      <ReviewsList data={[mockReview]} loading={false} onDelete={jest.fn()} onEdit={jest.fn()} />
    );

    // Should display fallback text
    expect(screen.getByText('Empresa')).toBeInTheDocument();

    // Should display fallback initials
    expect(screen.getByText('EM')).toBeInTheDocument();
  });

  it('handles company object without name', () => {
    const mockReview = createMockReview({ id: 789, logo_url: 'test.png' });

    render(
      <ReviewsList data={[mockReview]} loading={false} onDelete={jest.fn()} onEdit={jest.fn()} />
    );

    // Should display fallback text when name is missing
    expect(screen.getByText('Empresa')).toBeInTheDocument();

    // Should display fallback initials
    expect(screen.getByText('EM')).toBeInTheDocument();
  });
});
