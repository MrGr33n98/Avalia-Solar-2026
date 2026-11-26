import React from 'react';
import { render } from '@testing-library/react';
import { GoogleTagManager } from '@/components/GoogleTagManager';

// Mock next/script
jest.mock('next/script', () => {
  return function MockScript({ id, strategy, children }: any) {
    return (
      <div data-testid={`script-${id}`} data-strategy={strategy}>
        {children}
      </div>
    );
  };
});

describe('Google Consent Mode V2 Synchronous Initialization (TEST-03)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_ANALYTICS: 'true',
      NODE_ENV: 'production',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renders consent mode with beforeInteractive strategy to guarantee execution before hydration and tags', () => {
    const { getByTestId } = render(<GoogleTagManager gtmId="GTM-TEST123" />);

    const consentScript = getByTestId('script-google-consent-mode');
    expect(consentScript).toBeInTheDocument();
    expect(consentScript.getAttribute('data-strategy')).toBe('beforeInteractive');

    // Verify default denied configuration for LGPD / Consent Mode V2
    const content = consentScript.textContent || '';
    expect(content).toContain("'ad_storage': 'denied'");
    expect(content).toContain("'analytics_storage': 'denied'");
    expect(content).toContain("'ad_user_data': 'denied'");
    expect(content).toContain("'ad_personalization': 'denied'");
  });
});

