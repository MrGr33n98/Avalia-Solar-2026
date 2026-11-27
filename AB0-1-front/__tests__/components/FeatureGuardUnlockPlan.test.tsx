import { render, screen } from '@testing-library/react';
import FeatureGuard from '@/app/dashboard/components/FeatureGuard';
import type { FeatureAccessEntry } from '@/lib/api';

// Spec 027 — T020: o upsell usa o `unlock_plan` calculado pelo backend.
describe('FeatureGuard com unlock_plan', () => {
  const renderGuard = (entry: FeatureAccessEntry, extra: Record<string, unknown> = {}) =>
    render(
      <FeatureGuard entry={entry} title="Recurso" description="Descrição" {...extra}>
        <div>conteudo protegido</div>
      </FeatureGuard>
    );

  it('Free: mostra o plano público que libera o recurso', () => {
    renderGuard(
      {
        state: 'locked',
        value: false,
        unlock_plan: { id: 2, name: 'Essential', tier: 'essential' },
      },
      { currentPlanTier: 'free' }
    );

    expect(screen.getByText('Desbloquear com Essential')).toBeInTheDocument();
    expect(screen.getByText('Essential')).toBeInTheDocument();
  });

  it('Essencial: aponta o Pro e nunca o plano atual', () => {
    renderGuard(
      { state: 'locked', value: false, unlock_plan: { id: 3, name: 'Pro', tier: 'pro' } },
      { currentPlanTier: 'essential', targetPlanName: 'Plano Essencial' }
    );

    expect(screen.getByText('Desbloquear com Pro')).toBeInTheDocument();
    expect(screen.queryByText(/Desbloquear com Plano Essencial/)).not.toBeInTheDocument();
  });

  it('Pro: sem plano público que libere, oferece o comercial', () => {
    renderGuard(
      { state: 'locked', value: false, unlock_plan: null },
      { currentPlanTier: 'pro', targetPlanName: 'Plano Pro' }
    );

    expect(screen.getByText('Falar com o comercial')).toBeInTheDocument();
    expect(screen.queryByText(/Desbloquear com/)).not.toBeInTheDocument();
  });

  it('sem unlock_plan do backend, não sugere o plano atual vindo do fallback', () => {
    renderGuard({ state: 'locked', value: false }, { currentPlanTier: 'pro', targetPlanSlug: 'pro' });

    expect(screen.queryByText(/Desbloquear com/)).not.toBeInTheDocument();
    expect(screen.getByText('Fazer Upgrade Agora')).toBeInTheDocument();
  });
});
