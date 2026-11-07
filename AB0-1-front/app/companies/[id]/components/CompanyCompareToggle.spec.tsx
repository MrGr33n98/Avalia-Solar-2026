import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompanyCompareToggle from './CompanyCompareToggle';
import type { Company } from '@/lib/api';
import { useComparison } from '@/hooks/useComparison';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';
import { track } from '@/lib/analytics/lazy';
import { toast } from 'sonner';

jest.mock('@/hooks/useComparison', () => ({ useComparison: jest.fn() }));
jest.mock('@/lib/analytics/hooks/useIntentTracking', () => ({ sendIntentSignal: jest.fn() }));
jest.mock('@/lib/analytics/lazy', () => ({ track: jest.fn() }));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), info: jest.fn() },
}));

const company = { id: 372, name: 'WEG', slug: 'weg' } as Company;
const addToComparison = jest.fn();
const removeFromComparison = jest.fn();

const comparisonState = (selected: boolean, canAddMore = true) => {
  (useComparison as jest.Mock).mockReturnValue({
    isInComparison: jest.fn().mockReturnValue(selected),
    addToComparison,
    removeFromComparison,
    canAddMore,
  });
};

describe('CompanyCompareToggle — research intent (independent of paid CTAs)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    comparisonState(false);
  });

  it('renders only one native checkbox with the visible label Comparar', () => {
    render(<CompanyCompareToggle company={company} />);
    expect(screen.getByRole('checkbox', { name: 'Adicionar WEG à comparação' })).not.toBeChecked();
    expect(screen.getAllByText('Comparar')).toHaveLength(1);
    expect(screen.getByText('Comparar').closest('label')).toHaveClass('min-h-11');
  });

  it('adds to the real comparison store and preserves analytics/intent on check', () => {
    render(<CompanyCompareToggle company={company} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(addToComparison).toHaveBeenCalledWith(company);
    expect(track).toHaveBeenCalledWith('company_compare_click', expect.objectContaining({
      company_id: 372, action: 'add',
    }));
    expect(sendIntentSignal).toHaveBeenCalledWith(expect.objectContaining({
      signal_type: 'comparison_usage', metadata: { action: 'add', source: 'company_hero' },
    }));
    expect(toast.success).toHaveBeenCalled();
  });

  it('removes an existing selection without requiring free comparison capacity', () => {
    comparisonState(true, false);
    render(<CompanyCompareToggle company={company} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Remover WEG da comparação' });
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeEnabled();
    fireEvent.click(checkbox);
    expect(removeFromComparison).toHaveBeenCalledWith(372);
    expect(track).toHaveBeenCalledWith('company_compare_click', expect.objectContaining({
      action: 'remove',
    }));
    expect(toast.info).toHaveBeenCalled();
  });

  it('disables only addition when the comparison limit is reached', () => {
    comparisonState(false, false);
    render(<CompanyCompareToggle company={company} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(addToComparison).not.toHaveBeenCalled();
  });
});
