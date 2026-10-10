import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalStatusSummary } from '@/components/reviewer/proposals/ProposalStatusSummary';

describe('ProposalStatusSummary', () => {
  it('renderiza os 3 cards em grid-cols-3 permanente com contagens corretas', () => {
    const onSelectFilter = jest.fn();
    render(
      <ProposalStatusSummary
        stats={{ active: 5, received: 3, pending: 2 }}
        currentFilter="all"
        onSelectFilter={onSelectFilter}
      />
    );

    const section = screen.getByRole('region', { name: 'Resumo de status' });
    expect(section).toHaveClass('grid-cols-3');

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Ativas')).toBeInTheDocument();
    expect(screen.getByText('Recebidas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando')).toBeInTheDocument();

    const awaitingBtn = screen.getByRole('button', { name: /2 propostas aguardando retorno/i });
    fireEvent.click(awaitingBtn);
    expect(onSelectFilter).toHaveBeenCalledWith('awaiting');
  });

  it('permite alternar ou desmarcar filtro quando já ativo', () => {
    const onSelectFilter = jest.fn();
    render(
      <ProposalStatusSummary
        stats={{ active: 5, received: 3, pending: 2 }}
        currentFilter="active"
        onSelectFilter={onSelectFilter}
      />
    );

    const activeBtn = screen.getByRole('button', { name: /5 propostas ativas/i });
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(activeBtn);
    expect(onSelectFilter).toHaveBeenCalledWith('all');
  });
});
