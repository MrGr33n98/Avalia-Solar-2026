import { render } from '@testing-library/react';

import NoIndexHead from '@/components/NoIndexHead';

describe('NoIndexHead', () => {
  it('renders robots noindex meta tags', () => {
    const { container } = render(<NoIndexHead />);

    expect(container.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow, noarchive'
    );
    expect(container.querySelector('meta[name="googlebot"]')).toHaveAttribute(
      'content',
      'noindex, nofollow, noarchive'
    );
  });
});
