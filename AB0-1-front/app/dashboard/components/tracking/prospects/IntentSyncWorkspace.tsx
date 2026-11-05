/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  intentSyncApi, type ActivationAudience, type IntentProvider, type IntentTab,
} from '@/lib/api/intent-sync';

const PROVIDERS: Array<{ id: IntentProvider; name: string; logo: string }> = [
  { id: 'linkedin', name: 'LinkedIn Ads', logo: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  { id: 'meta', name: 'Meta Ads', logo: 'https://cdn.simpleicons.org/meta/0866FF' },
  { id: 'google', name: 'Google Ads', logo: 'https://cdn.simpleicons.org/googleads/4285F4' },
];

const TABS: { key: IntentTab; name: string }[] = [
  { key: 'overview', name: 'Resumo' },
  { key: 'audiences', name: 'Audiências' },
  { key: 'sources', name: 'Fontes' },
  { key: 'history', name: 'Histórico' },
];

const PANEL = 'rounded-md border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))]';
const MUTED = 'text-[hsl(var(--dashboard-muted))]';
const BTN = 'h-8 rounded-md px-3 text-xs';
type Props = { companyId: string | number; onBack: () => void };

function ProviderAvatar({ provider, size = 28 }: { provider: (typeof PROVIDERS)[number]; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white"
      style={{ width: size, height: size }}>
      <img src={provider.logo} alt={`Logo ${provider.name}`} width={size - 12} height={size - 12}
        loading="lazy" className="object-contain" />
    </span>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={cn(PANEL, 'min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3')}>
      <div className="flex items-baseline gap-1.5">
        <strong className="text-base font-semibold tabular-nums text-[hsl(var(--dashboard-ink))] sm:text-lg">{value}</strong>
        <span className={cn('truncate text-[10px] sm:text-xs', MUTED)}>{label}</span>
      </div>
    </div>
  );
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md border px-3 py-2.5 text-xs leading-relaxed',
        tone === 'error' ? 'border-red-300 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-slate-800')}>
      {children}
    </div>
  );
}

function AudienceRow({ audience, onArchive, archiving, canArchive }: {
  audience: ActivationAudience;
  onArchive: (id: number) => void;
  archiving: number | null;
  canArchive: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_100px_auto]">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-900">{audience.name}</p>
        <p className={cn('mt-0.5 text-[11px] md:hidden', MUTED)}>Versão {audience.version} · Rascunho</p>
      </div>
      <span className={cn('hidden text-xs md:block', MUTED)}>{audience.source_id ? 'Fonte aguardando verificação' : 'Sem fonte vinculada'}</span>
      <Badge variant="outline" className="hidden w-fit rounded-sm text-[10px] md:inline-flex">Rascunho</Badge>
      <div className="flex justify-end">
        <Button type="button" size="sm" variant="ghost" className={BTN}
          disabled={!canArchive || archiving === audience.id}
          onClick={() => onArchive(audience.id)}
          aria-label={`Arquivar audiência ${audience.name}`}>Arquivar</Button>
      </div>
    </div>
  );
}

function DraftForm({ companyId, close }: { companyId: string | number; close: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [segment, setSegment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await intentSyncApi.createAudience(companyId, {
        name: name.trim(),
        filter_definition: {
          ...(region.trim() ? { region: region.trim() } : {}),
          ...(segment.trim() ? { segment: segment.trim() } : {}),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ['intent-sync-audiences', companyId] });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o rascunho.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn(PANEL, 'space-y-3 p-3 sm:p-4')} aria-label="Nova audiência">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Nova audiência</h3>
          <p className={cn('text-[11px]', MUTED)}>Etapa {step} de 3 · Somente rascunho, sem transmissão</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className={BTN} onClick={close}>Fechar</Button>
      </header>
      {step === 1 && (
        <div className="space-y-2">
          <Label htmlFor="intent-audience-name" className="text-xs">Nome da audiência</Label>
          <Input id="intent-audience-name" maxLength={120} value={name} onChange={e => setName(e.target.value)}
            className="h-9 rounded-md text-sm" placeholder="Ex.: Empresas comerciais SC" />
          <p className={cn('text-xs', MUTED)}>Identificação interna da empresa. Não insira dados pessoais.</p>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="intent-region" className="text-xs">Região (opcional)</Label>
            <Input id="intent-region" maxLength={80} value={region} onChange={e => setRegion(e.target.value)}
              placeholder="Ex.: SC" className="h-9 rounded-md text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="intent-segment" className="text-xs">Segmento (opcional)</Label>
            <Input id="intent-segment" maxLength={80} value={segment} onChange={e => setSegment(e.target.value)}
              placeholder="Ex.: Integradores" className="h-9 rounded-md text-sm" />
          </div>
          <p className={cn('text-xs sm:col-span-2', MUTED)}>
            Os filtros são metadados do rascunho. A contagem e a elegibilidade dependem de fonte verificada.
          </p>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between gap-2"><span className={MUTED}>Nome</span><strong>{name.trim()}</strong></div>
          <div className="flex justify-between gap-2"><span className={MUTED}>Região</span><span>{region || 'Todas'}</span></div>
          <div className="flex justify-between gap-2"><span className={MUTED}>Segmento</span><span>{segment || 'Todos'}</span></div>
          <Notice>O rascunho não realiza upload de contatos nem cria uma audiência nas plataformas publicitárias.</Notice>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {step > 1 && <Button type="button" variant="outline" className={BTN} onClick={() => setStep(step - 1)}>Voltar</Button>}
        {step < 3 ? (
          <Button type="button" className={BTN} onClick={() => setStep(step + 1)}
            disabled={step === 1 && !name.trim()}>Continuar</Button>
        ) : (
          <Button type="button" className={BTN} onClick={save} disabled={busy || !name.trim()}>
            {busy ? 'Salvando…' : 'Salvar rascunho'}
          </Button>
        )}
      </div>
    </section>
  );
}

export default function IntentSyncWorkspace({ companyId, onBack }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tabParam = searchParams.get('integration_tab');
  const activeTab: IntentTab = TABS.some(t => t.key === tabParam) ? tabParam as IntentTab : 'overview';
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState<number | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [sourceBusy, setSourceBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const statusQuery = useQuery({
    queryKey: ['intent-sync-status', companyId],
    queryFn: () => intentSyncApi.status(companyId),
    enabled: Boolean(companyId),
    retry: false,
  });
  const available = statusQuery.data?.available === true;
  const audiencesQuery = useQuery({
    queryKey: ['intent-sync-audiences', companyId],
    queryFn: () => intentSyncApi.audiences(companyId),
    enabled: available,
    retry: false,
  });
  const sourcesQuery = useQuery({
    queryKey: ['intent-sync-sources', companyId],
    queryFn: () => intentSyncApi.sources(companyId),
    enabled: available,
    retry: false,
  });
  const historyQuery = useQuery({
    queryKey: ['intent-sync-history', companyId],
    queryFn: () => intentSyncApi.history(companyId),
    enabled: available,
    retry: false,
  });
  const audienceItems = audiencesQuery.data?.audiences ?? [];
  const sourceItems = sourcesQuery.data?.sources ?? [];
  const historyItems = historyQuery.data?.jobs ?? [];
  const canManage = statusQuery.data?.roles.membership !== 'editor';
  const isLoading = statusQuery.isLoading;
  const connectionCount = 0; // No OAuth is supported or connected in the guarded MVP.
  const kpis = useMemo(() => [
    { label: 'Conexões', value: connectionCount },
    { label: 'Audiências', value: available && !audiencesQuery.isLoading ? audiencesQuery.data?.pagination.total ?? 0 : '—' },
    { label: 'Fontes', value: available && !sourcesQuery.isLoading ? sourceItems.length : '—' },
    { label: 'Sincronizações', value: available && !historyQuery.isLoading ? historyItems.length : '—' },
  ], [available, audiencesQuery.data?.pagination.total, audiencesQuery.isLoading, sourceItems.length, sourcesQuery.isLoading, historyItems.length, historyQuery.isLoading]);

  const selectTab = (next: IntentTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('integration_tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const archive = async (id: number) => {
    if (!window.confirm('Arquivar esta audiência?')) return;
    setArchiving(id);
    setActionError('');
    try {
      await intentSyncApi.archiveAudience(companyId, id);
      await queryClient.invalidateQueries({ queryKey: ['intent-sync-audiences', companyId] });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Falha ao arquivar.');
    } finally {
      setArchiving(null);
    }
  };

  const registerSource = async (event: React.FormEvent) => {
    event.preventDefault();
    setSourceBusy(true);
    setActionError('');
    try {
      await intentSyncApi.registerSource(companyId, {
        name: sourceName.trim(),
        provenance: { purpose: purpose.trim(), legal_basis: legalBasis, attestation_version: 'v1' },
      });
      setSourceName('');
      setPurpose('');
      setLegalBasis('');
      await queryClient.invalidateQueries({ queryKey: ['intent-sync-sources', companyId] });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Falha ao registrar fonte.');
    } finally {
      setSourceBusy(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 font-sans" aria-labelledby="intent-sync-title">
      <header className={cn(PANEL, 'flex flex-wrap items-start justify-between gap-3 p-3 sm:p-4')}>
        <div>
          <button type="button" className="mb-1 text-[11px] font-medium text-blue-700 underline-offset-2 hover:underline"
            onClick={onBack}>Integrações / Voltar</button>
          <h2 id="intent-sync-title" className="text-lg font-semibold tracking-tight">Intent Sync</h2>
          <p className={cn('mt-1 max-w-xl text-xs leading-relaxed', MUTED)}>
            Gerencie audiências próprias da sua empresa. Nenhum contato do CRM interno ou visitante do marketplace é transferido.
          </p>
        </div>
        <Badge variant="outline" className="rounded-sm text-[11px]">
          {available ? 'Rascunhos habilitados' : 'Liberação pendente'}
        </Badge>
      </header>

      {isLoading ? (
        <div role="status" className={cn(PANEL, 'p-4 text-xs', MUTED)}>Consultando disponibilidade…</div>
      ) : statusQuery.isError ? (
        <Notice tone="error">Não foi possível consultar a disponibilidade. <Button type="button" variant="link" size="sm"
          onClick={() => statusQuery.refetch()}>Tentar novamente</Button></Notice>
      ) : !available ? (
        <section className={cn(PANEL, 'space-y-3 p-4')}>
          <h3 className="text-sm font-semibold">
            {statusQuery.data?.reason === 'upgrade_required' ? 'Recurso não incluído no seu plano' : 'Integração em preparação'}
          </h3>
          <p className={cn('text-xs leading-relaxed', MUTED)}>
            {statusQuery.data?.reason === 'upgrade_required'
              ? 'Sua empresa ainda não tem acesso ao Intent Sync. Consulte os planos disponíveis.'
              : 'As integrações publicitárias estão em validação de segurança, privacidade e permissões. Nenhuma conexão é iniciada nesta etapa.'}
          </p>
          {statusQuery.data?.reason === 'upgrade_required' && (
            <Button asChild size="sm" className={BTN}><a href="/plans">Ver planos</a></Button>
          )}
        </section>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3" aria-label="Indicadores do Intent Sync">
            {kpis.map(metric => <Kpi key={metric.label} {...metric} />)}
          </div>
          <Notice>Modo de preparação: somente fontes de metadados e rascunhos. OAuth, importação de contatos e sincronização externa permanecem bloqueados até aprovação.</Notice>
          <nav aria-label="Seções do Intent Sync" className="flex gap-1 overflow-x-auto border-b border-slate-200">
            {TABS.map(tab => (
              <button key={tab.key} type="button" onClick={() => selectTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={cn('shrink-0 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900')}>
                {tab.name}
              </button>
            ))}
          </nav>
          {actionError && <Notice tone="error">{actionError}</Notice>}

          {activeTab === 'overview' && (
            <section className={cn(PANEL, 'divide-y divide-slate-100')} aria-label="Plataformas">
              <header className="flex items-center justify-between px-3 py-3 sm:px-4">
                <h3 className="text-sm font-semibold">Plataformas publicitárias</h3>
                <span className={cn('text-[11px]', MUTED)}>Nenhuma conexão ativa</span>
              </header>
              {PROVIDERS.map(provider => (
                <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-2.5">
                    <ProviderAvatar provider={provider} />
                    <div>
                      <p className="text-xs font-semibold">{provider.name}</p>
                      <p className={cn('text-[11px]', MUTED)}>Aguardando aprovação do provedor</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className={BTN} disabled
                    title="Conexões ainda indisponíveis">Conectar</Button>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'audiences' && (
            <section className="space-y-3">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Audiências da empresa</h3>
                <Button type="button" size="sm" className={BTN} disabled={!statusQuery.data?.capabilities.create_draft}
                  onClick={() => setCreating(!creating)}>{creating ? 'Cancelar' : 'Nova audiência'}</Button>
              </header>
              {creating && <DraftForm companyId={companyId} close={() => setCreating(false)} />}
              <div className={PANEL}>
                {audiencesQuery.isLoading ? (
                  <p className={cn('p-4 text-xs', MUTED)}>Carregando audiências…</p>
                ) : audiencesQuery.isError ? (
                  <div className="p-3"><Notice tone="error">Falha ao consultar audiências.</Notice></div>
                ) : audienceItems.length === 0 ? (
                  <div className="p-4"><p className="text-xs font-medium">Nenhuma audiência criada</p>
                    <p className={cn('mt-1 text-xs', MUTED)}>Crie um rascunho para planejar filtros. Não há transmissão de dados.</p>
                  </div>
                ) : (
                  audienceItems.map(item => <AudienceRow key={item.id} audience={item}
                    onArchive={archive} archiving={archiving} canArchive={canManage} />)
                )}
              </div>
              {(audiencesQuery.data?.pagination.total_pages ?? 0) > 1 && (
                <p className={cn('text-xs', MUTED)}>Exibindo a primeira página; paginação completa será habilitada após revisão.</p>
              )}
            </section>
          )}

          {activeTab === 'sources' && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Fontes de dados próprias</h3>
              <Notice>A fonte registrada permanece pendente até verificação. Não envie contatos, e-mails ou telefones neste formulário.</Notice>
              {canManage && (
                <form onSubmit={registerSource} className={cn(PANEL, 'grid gap-3 p-3 sm:grid-cols-2 sm:p-4')}>
                  <div className="space-y-1"><Label htmlFor="intent-source-name" className="text-xs">Nome interno</Label>
                    <Input id="intent-source-name" className="h-9 rounded-md" maxLength={120} required
                      value={sourceName} onChange={e => setSourceName(e.target.value)}
                      placeholder="Ex.: Base própria autorizada" />
                  </div>
                  <div className="space-y-1"><Label htmlFor="intent-source-basis" className="text-xs">Base legal declarada</Label>
                    <select id="intent-source-basis" className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      required value={legalBasis} onChange={e => setLegalBasis(e.target.value)}>
                      <option value="">Selecione para revisão</option>
                      <option value="consent">Consentimento</option>
                      <option value="legitimate_interest">Legítimo interesse (sujeito a análise)</option>
                      <option value="other">Outra (sujeito a análise)</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2"><Label htmlFor="intent-source-purpose" className="text-xs">Finalidade declarada</Label>
                    <Input id="intent-source-purpose" className="h-9 rounded-md" maxLength={255} required
                      value={purpose} onChange={e => setPurpose(e.target.value)}
                      placeholder="Finalidade de publicidade a ser revisada" />
                  </div>
                  <p className={cn('text-[11px] sm:col-span-2', MUTED)}>
                    Este registro não comprova automaticamente conformidade nem autoriza sincronização.
                  </p>
                  <div className="sm:col-span-2"><Button type="submit" size="sm" className={BTN}
                    disabled={sourceBusy || !sourceName.trim() || !purpose.trim() || !legalBasis}>
                    {sourceBusy ? 'Registrando…' : 'Registrar para análise'}</Button></div>
                </form>
              )}
              <div className={PANEL}>
                {sourcesQuery.isLoading ? <p className={cn('p-4 text-xs', MUTED)}>Carregando fontes…</p>
                  : sourcesQuery.isError ? <div className="p-3"><Notice tone="error">Falha ao consultar fontes.</Notice></div>
                  : sourceItems.length === 0 ? <p className={cn('p-4 text-xs', MUTED)}>Nenhuma fonte cadastrada.</p>
                  : sourceItems.map(source => (
                    <div key={source.id} className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0">
                      <span className="truncate text-xs font-medium">{source.name}</span>
                      <Badge variant="outline" className="rounded-sm text-[10px]">{source.verification_status === 'pending' ? 'Pendente' : source.verification_status}</Badge>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {activeTab === 'history' && (
            <section className={PANEL}>
              <header className="border-b border-slate-100 p-3"><h3 className="text-sm font-semibold">Histórico de sincronizações</h3></header>
              {historyQuery.isLoading ? <p className={cn('p-4 text-xs', MUTED)}>Carregando histórico…</p>
                : historyQuery.isError ? <div className="p-3"><Notice tone="error">Não foi possível carregar o histórico.</Notice></div>
                : historyItems.length === 0 ? (
                  <p className={cn('p-4 text-xs', MUTED)}>Nenhuma sincronização realizada. Os provedores ainda não estão habilitados.</p>
                ) : historyItems.map(job => (
                  <div key={job.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 px-3 py-3 text-xs last:border-0">
                    <span>Execução #{job.id} · Audiência #{job.audience_segment_id}</span>
                    <Badge variant="outline" className="rounded-sm text-[10px]">{job.status}</Badge>
                    <span className={MUTED}>{job.created_at ? new Date(job.created_at).toLocaleString('pt-BR') : '—'}</span>
                  </div>
                ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
