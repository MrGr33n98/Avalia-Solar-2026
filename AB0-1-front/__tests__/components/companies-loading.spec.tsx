import React from 'react';
import { render } from '@testing-library/react';
import CompaniesLoading from '../../app/companies/loading';

describe('CompaniesLoading (P0-002)', () => {
  it('renders structural skeletons faithfully with zero layout shift', () => {
    const { container } = render(<CompaniesLoading />);
    expect(container.firstChild).toBeInTheDocument();

    // Skeletons de cards presentes (12 cards)
    const cardSkeletons = container.querySelectorAll('[data-testid="company-card-skeleton"]');
    expect(cardSkeletons.length).toBe(12);

    // Sidebar presente no desktop
    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeInTheDocument();
  });
});
