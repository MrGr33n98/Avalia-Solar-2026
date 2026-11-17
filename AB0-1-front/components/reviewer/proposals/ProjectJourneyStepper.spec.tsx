import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectJourneyStepper, type BuyerProjectStep } from './ProjectJourneyStepper';

const steps: BuyerProjectStep[] = [
  { id: 1, label: 'Solicitação enviada', shortLabel: 'Enviada', done: true, active: false },
  { id: 2, label: 'Propostas recebidas (2)', shortLabel: 'Recebidas', done: false, active: true },
  { id: 3, label: 'Em análise (0)', shortLabel: 'Análise', done: false, active: false },
  { id: 4, label: 'Decisão', shortLabel: 'Decisão', done: false, active: false },
  { id: 5, label: 'Projeto', shortLabel: 'Projeto', done: false, active: false },
];

describe('ProjectJourneyStepper', () => {
  it('exibe cinco etapas com nomes acessíveis completos e destaca a atual', () => {
    render(<ProjectJourneyStepper steps={steps} />);

    const region = screen.getByRole('region', { name: 'Etapas do projeto' });
    expect(region).toHaveClass('overflow-x-auto', 'min-[390px]:overflow-x-visible');
    expect(region).toHaveAttribute('tabindex', '0');

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveAttribute('aria-label', 'Propostas recebidas (2) — etapa atual');
    expect(items[0]).toHaveAttribute('aria-label', 'Solicitação enviada — concluída');
    expect(items[2]).toHaveAttribute('aria-label', 'Em análise (0) — pendente');
    expect(screen.getByText('Recebidas')).toBeInTheDocument();
    expect(screen.getByText('Propostas recebidas (2)')).toBeInTheDocument();
    expect(region.querySelectorAll('.truncate, .line-clamp-2')).toHaveLength(0);
  });

  it('não altera a semântica quando a etapa ativa muda', () => {
    const { rerender } = render(<ProjectJourneyStepper steps={steps} />);
    rerender(
      <ProjectJourneyStepper
        steps={steps.map((s) => ({ ...s, active: s.id === 3, done: s.id < 3 }))}
      />
    );
    const current = screen.getAllByRole('listitem').filter((el) => el.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-label', 'Em análise (0) — etapa atual');
  });
});
