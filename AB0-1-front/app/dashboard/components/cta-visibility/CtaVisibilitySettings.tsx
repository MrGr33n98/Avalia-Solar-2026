'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';

type Preferences = { quote_cta_enabled: boolean; whatsapp_enabled: boolean };
type CtaVisibilityResponse = {
  company_id: number;
  preferences: Preferences;
  availability: { quote: boolean; whatsapp: boolean; whatsapp_configured: boolean };
  effective: { quote: boolean; whatsapp: boolean };
  version: number;
  cache_state?: 'revalidated' | 'not_configured' | 'pending_retry' | 'unchanged';
};

export default function CtaVisibilitySettings({ companyId }: { companyId: string }) {
  const [snapshot, setSnapshot] = useState<CtaVisibilityResponse | null>(null);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const activeId = useRef(companyId);
  activeId.current = companyId;

  useEffect(() => {
    let cancelled = false;
    setSnapshot(null);
    setDraft(null);
    setScope(null);
    setLoading(true);
    setNotice('');
    fetchApi<CtaVisibilityResponse>('/company_dashboard/cta_visibility', {
      method: 'GET', params: { company_id: companyId },
    }).then((response) => {
      if (cancelled || activeId.current !== companyId) return;
      if (String(response.company_id) !== String(companyId)) throw new Error('tenant_mismatch');
      setSnapshot(response);
      setDraft({ ...response.preferences });
      setScope(companyId);
    }).catch(() => {
      if (!cancelled && activeId.current === companyId) setNotice('Não foi possível carregar as preferências. Tente novamente.');
    }).finally(() => {
      if (!cancelled && activeId.current === companyId) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [companyId, refresh]);

  const ready = scope === companyId && !loading && Boolean(snapshot && draft);
  const actual = ready ? snapshot! : null;
  const proposed = ready ? draft! : null;
  const changed = Boolean(actual && proposed && (
    proposed.quote_cta_enabled !== actual.preferences.quote_cta_enabled ||
    proposed.whatsapp_enabled !== actual.preferences.whatsapp_enabled
  ));
  const quoteVisible = Boolean(actual?.availability.quote && proposed?.quote_cta_enabled);
  const whatsappVisible = Boolean(actual?.availability.whatsapp && actual?.availability.whatsapp_configured &&
    proposed?.whatsapp_enabled);

  const save = async () => {
    if (!changed || !actual || !proposed || saving) return;
    setSaving(true);
    setNotice('');
    try {
      const response = await fetchApi<CtaVisibilityResponse>('/company_dashboard/cta_visibility', {
        method: 'PATCH', params: { company_id: companyId },
        body: JSON.stringify({
          quote_cta_enabled: proposed.quote_cta_enabled,
          whatsapp_enabled: proposed.whatsapp_enabled,
          expected_version: actual.version,
        }),
      });
      if (activeId.current !== companyId) return;
      if (String(response.company_id) !== String(companyId)) throw new Error('tenant_mismatch');
      setSnapshot(response);
      setDraft({ ...response.preferences });
      setNotice(response.cache_state === 'revalidated'
        ? 'Preferências publicadas. A página pública foi atualizada.'
        : response.cache_state === 'not_configured'
          ? 'Preferências salvas, mas a atualização do cache público não está configurada. Confirme a publicação antes de divulgar.'
          : response.cache_state === 'pending_retry'
            ? 'Preferências salvas. A atualização do perfil público está em reprocessamento.'
            : 'Preferências confirmadas.');
      track('company_cta_visibility_saved', {
        company_id: companyId, config_version: response.version,
        quote_enabled: response.preferences.quote_cta_enabled,
        whatsapp_enabled: response.preferences.whatsapp_enabled,
      });
    } catch {
      if (activeId.current !== companyId) return;
      // Discard failed optimistic state, reload authoritative state (including conflict 409).
      setDraft({ ...actual.preferences });
      setNotice('Não foi possível salvar. As alterações não foram publicadas; atualize os dados e tente novamente.');
      track('company_cta_visibility_save_failed', {
        company_id: companyId, error_category: 'request_failed',
      });
    } finally {
      if (activeId.current === companyId) setSaving(false);
    }
  };

  return (
    <section data-testid="cta-visibility-settings" aria-labelledby="cta-visibility-heading"
      className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[hsl(var(--dashboard-accent))]">Brand Page / Conversão</p>
          <h2 id="cta-visibility-heading" className="mt-1 text-base font-semibold text-[hsl(var(--dashboard-ink))]">
            Visibilidade dos botões
          </h2>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">Escolha quais ações serão exibidas no perfil público. Não altera seu plano.</p>
        </div>
        <span className="rounded-md border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-2 py-1 text-[11px] font-semibold text-[hsl(var(--dashboard-accent))]">
          Configuração independente
        </span>
      </div>

      {loading && <p role="status" className="mt-4 text-sm text-[hsl(var(--dashboard-muted))]">Carregando preferências…</p>}
      {!ready && !loading && (
        <Button type="button" variant="outline" className="mt-4 min-h-11"
          onClick={() => setRefresh((v) => v + 1)}>Tentar novamente</Button>
      )}

      {ready && actual && proposed && (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {([
              { key: 'quote_cta_enabled' as const, title: 'Exibir Solicitar orçamento',
                description: 'Abre o formulário de orçamento da plataforma.',
                available: actual.availability.quote, configured: true },
              { key: 'whatsapp_enabled' as const, title: 'Exibir WhatsApp',
                description: 'Conversa direta com o número público cadastrado.',
                available: actual.availability.whatsapp, configured: actual.availability.whatsapp_configured },
            ]).map((item) => {
              const checked = proposed[item.key];
              const unavailable = !item.available;
              return (
                <label key={item.key}
                  className="flex min-h-[92px] cursor-pointer items-start gap-3 rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-3 focus-within:ring-2 focus-within:ring-[hsl(var(--dashboard-accent))]">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--dashboard-accent))]"
                    data-testid={'cta-checkbox-' + item.key}
                    checked={checked}
                    disabled={saving || ((!item.available || !item.configured) && !checked)}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, [item.key]: e.target.checked } : prev)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[hsl(var(--dashboard-ink))]">{item.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[hsl(var(--dashboard-muted))]">{item.description}</span>
                    <span className={'mt-2 block text-[11px] font-medium ' +
                      (unavailable || !item.configured ? 'text-amber-700' : checked ? 'text-emerald-700' : 'text-[hsl(var(--dashboard-muted))]')}>
                      {unavailable ? 'Indisponível no plano atual' :
                        !item.configured ? 'Configure um WhatsApp válido para exibir' :
                        checked ? 'Ativado' : 'Desativado'}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {(!actual.availability.quote || !actual.availability.whatsapp) &&
            <Link href={'/dashboard?company_id=' + encodeURIComponent(companyId) + '&tab=product-pricing'}
              className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[hsl(var(--dashboard-accent))] hover:underline">
              Consultar planos e benefícios →
            </Link>}

          <div className="mt-4 rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-3">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-xs text-[hsl(var(--dashboard-ink))]">Prévia do hero</strong>
              <span className="text-[11px] text-[hsl(var(--dashboard-muted))]">Prévia — publicação após salvar</span>
            </div>
            <div data-testid="cta-preview" className="mt-3 flex flex-wrap gap-2">
              {quoteVisible && <span className="inline-flex min-h-11 items-center rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 text-xs font-semibold text-white">Solicitar orçamento</span>}
              {whatsappVisible && <span className="inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white">WhatsApp</span>}
              <span className="inline-flex min-h-11 items-center rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-xs text-[hsl(var(--dashboard-ink))]">Comparar</span>
              <span className="inline-flex min-h-11 items-center rounded-lg border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] px-3 text-xs text-[hsl(var(--dashboard-ink))]">Avaliar</span>
            </div>
            <p className="mt-2 text-[11px] text-[hsl(var(--dashboard-muted))]">A prévia não concede permissões nem modifica o perfil sem salvar.</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {changed && <span className="text-xs text-amber-700">Alterações não salvas</span>}
            <Button type="button" onClick={() => { void save(); }} disabled={!changed || saving}
              data-testid="save-cta-visibility" className="min-h-11 bg-[hsl(var(--dashboard-accent))] text-white hover:bg-[hsl(var(--dashboard-accent))/0.9]">
              {saving ? 'Salvando…' : 'Salvar visibilidade'}
            </Button>
          </div>
        </>
      )}
      {notice && <p role="status" aria-live="polite" className="mt-3 rounded-md border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-3 py-2 text-xs text-[hsl(var(--dashboard-ink))]">{notice}</p>}
    </section>
  );
}
