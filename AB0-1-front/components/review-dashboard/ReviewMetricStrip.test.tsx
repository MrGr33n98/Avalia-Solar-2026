import { fireEvent, render, screen } from '@testing-library/react';
import { ReviewMetricStrip } from './ReviewMetricStrip';

describe('ReviewMetricStrip', () => {
  it('mostra quatro métricas compactas em linha, com números junto aos rótulos', () => {
    const { container } = render(
      <ReviewMetricStrip total={3} published={2} pending={1} rejected={0} />
    );

    expect(container.querySelector('.grid-cols-4')).not.toBeNull();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('permite filtrar por status com estado acessível', () => {
    const onSelect = jest.fn();
    render(
      <ReviewMetricStrip
        total={3} published={2} pending={1} rejected={0}
        active="all" onSelect={onSelect}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(buttons[2]);
    expect(onSelect).toHaveBeenCalledWith('in_review');
  });
});
