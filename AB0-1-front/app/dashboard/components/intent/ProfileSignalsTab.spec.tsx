import { render, screen } from '@testing-library/react';
import ProfileSignalsTab from './ProfileSignalsTab';
import { EMPTY_REPORTING_DATA } from '@/lib/api/buyer-intent';

describe('ProfileSignalsTab — verified telemetry only', () => {
  const props = {
    accounts: [],
    reportingData: EMPTY_REPORTING_DATA,
    days: '90d' as const,
    companyName: 'Empresa Teste',
    onSelectAccount: jest.fn(),
  };

  it('does not invent one visit in each section when the source reports zero', () => {
    render(<ProfileSignalsTab {...props} />);
    expect(screen.getAllByText(/não mensurado/i)).toHaveLength(4);
    expect(screen.queryByText(/1 acessos/i)).not.toBeInTheDocument();
  });

  it('does not synthesize category-section visits from aggregate views', () => {
    render(<ProfileSignalsTab {...props}
      reportingData={{
        ...EMPTY_REPORTING_DATA,
        traffic_ratio: { ...EMPTY_REPORTING_DATA.traffic_ratio, direct_pageviews: 10 },
      }} />);
    expect(screen.getAllByText(/não mensurado/i)).toHaveLength(4);
    expect(screen.queryByText(/4 acessos/i)).not.toBeInTheDocument();
  });

  it('does not claim an unverified 3.2x lift in conversions', () => {
    render(<ProfileSignalsTab {...props} />);
    expect(screen.queryByText(/3[.,]2x/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/convertem até/i)).not.toBeInTheDocument();
  });
});
