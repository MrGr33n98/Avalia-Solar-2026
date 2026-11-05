import {
  REVIEW_MILESTONES,
  completedMilestones,
  milestoneProgress,
  milestoneState,
  normalizedApprovedCount,
} from './milestones';

describe('Contrato dos marcos de coleta (sem concessão de badge)', () => {
  it('utiliza metas 1, 10 e 20 aprovadas e os títulos de jornada', () => {
    expect(REVIEW_MILESTONES.map((item) => item.target)).toEqual([1, 10, 20]);
    expect(REVIEW_MILESTONES.map((item) => item.title)).toEqual([
      'Ganhe sua Primeira Avaliação',
      'Prepare-se para o Ranking',
      'Selo “Usuários nos Amam”',
    ]);
  });

  it.each([
    [0, 0, 0],
    [1, 1, 5],
    [9, 1, 45],
    [10, 2, 50],
    [19, 2, 95],
    [20, 3, 100],
    [30, 3, 100],
  ])('count=%i: %i etapas completas e %i%% da trilha', (count, completed, progress) => {
    expect(completedMilestones(count)).toBe(completed);
    expect(milestoneProgress(count)).toBe(progress);
  });

  it('diferencia etapas concluídas, próxima e a conquistar', () => {
    expect(milestoneState(1, 0)).toBe('current');
    expect(milestoneState(10, 0)).toBe('locked');
    expect(milestoneState(1, 10)).toBe('achieved');
    expect(milestoneState(20, 10)).toBe('current');
    expect(milestoneState(20, 20)).toBe('achieved');
  });

  it('trata ausência e valores inválidos como indisponibilidade — não zero fictício', () => {
    expect(normalizedApprovedCount(null)).toBeNull();
    expect(normalizedApprovedCount(-1)).toBeNull();
    expect(normalizedApprovedCount(Number.NaN)).toBeNull();
    expect(normalizedApprovedCount(5.9)).toBe(5);
    expect(milestoneState(1, null)).toBe('unavailable');
  });

  it('não publica métricas de marketing sem fonte ou promessa de selo automático', () => {
    const messages = REVIEW_MILESTONES.flatMap((m) => [m.summary, m.task, ...m.hints.map((hint) => hint.text)]).join(' ');
    expect(messages).not.toMatch(/65%|85%|100x|tráfego orgânico dobra|3x mais|100% dos/);
    expect(messages).toMatch(/não há concessão automática/);
  });
});
