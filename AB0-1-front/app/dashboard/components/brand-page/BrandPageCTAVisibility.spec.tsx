import { render, screen } from '@testing-library/react';
import BrandPageCTAVisibility from './BrandPageCTAVisibility';

jest.mock('../cta-visibility/CtaVisibilitySettings', () => ({
  __esModule: true,
  default: ({ companyId }: { companyId: string }) => (
    <div data-testid="canonical-cta-settings">{companyId}</div>
  ),
}));

describe('BrandPageCTAVisibility', () => {
  it('delegates to the tenant-scoped canonical settings implementation', () => {
    render(<BrandPageCTAVisibility companyId="372" />);
    expect(screen.getByTestId('canonical-cta-settings')).toHaveTextContent('372');
  });
});
