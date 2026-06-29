import { render, screen } from '@testing-library/react';
import HowItWorks from '@/components/landing/HowItWorks';

describe('HowItWorks', () => {
  it('shows the three actions without numbered badges and with enlarged icons', () => {
    const { container } = render(<HowItWorks />);

    expect(screen.getByText('Buscar')).toBeInTheDocument();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.getByText('Pedir orçamento')).toBeInTheDocument();
    expect(screen.queryByText('01')).not.toBeInTheDocument();
    expect(screen.queryByText('02')).not.toBeInTheDocument();
    expect(screen.queryByText('03')).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg.h-7.w-7')).toHaveLength(3);
  });
});
