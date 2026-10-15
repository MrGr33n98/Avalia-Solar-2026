'use client';

import { useState } from 'react';
import { Copy, Check, ShieldCheck, AlertTriangle, Plus, Trash2, Globe, Code2, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { companyDashboardApi, type ProspectsWorkspaceResponse } from '@/lib/api';

interface Props {
  data: ProspectsWorkspaceResponse;
  companyId: string | number;
  onRefresh: () => void;
}

export default function ProspectsInstallationTab({ data, companyId, onRefresh }: Props) {
  const { tag_info } = data;
  const [copied, setCopied] = useState(false);
  const [origins, setOrigins] = useState<string[]>(tag_info.allowed_origins || []);
  const [newOrigin, setNewOrigin] = useState('');
  const [originError, setOriginError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const snippetCode = tag_info.snippet_url
    ? `<script async src="${tag_info.snippet_url}"></script>`
    : '<!-- Tag ainda não configurada para esta empresa -->';

  const handleCopy = () => {
    if (tag_info.snippet_url) {
      navigator.clipboard.writeText(snippetCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddOrigin = () => {
    setOriginError('');
    const trimmed = newOrigin.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://localhost')) {
      setOriginError('O domínio deve iniciar com https:// (ou http://localhost em desenvolvimento).');
      return;
    }

    try {
      const url = new URL(trimmed);
      const normalizedOrigin = url.origin;
      if (origins.includes(normalizedOrigin)) {
        setOriginError('Este domínio já foi adicionado.');
        return;
      }
      setOrigins([...origins, normalizedOrigin]);
      setNewOrigin('');
    } catch {
      setOriginError('Formato de URL inválido. Exemplo: https://suaempresa.com.br');
    }
  };

  const handleRemoveOrigin = (orig: string) => {
    setOrigins(origins.filter((o) => o !== orig));
  };

  const handleSaveOrigins = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await companyDashboardApi.updateProspectsSettings(companyId, {
        allowed_origins: origins,
      });
      setSaveSuccess(true);
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar domínios:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTagStatus = () => {
    switch (tag_info.status) {
      case 'healthy':
        return (
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tag Ativa e Saudável (Telemetria recente observada)</span>
          </div>
        );
      case 'possibly_inactive':
        return (
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Tag Possivelmente Inativa (Sem eventos nos últimos 7 dias)</span>
          </div>
        );
      case 'configured_no_evidence':
        return (
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Globe className="h-4 w-4" />
            <span>Tag Configurada (Aguardando primeiras interações no seu site)</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
            <span>Rastreamento Desativado nas Configurações</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Tag Não Instalada</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--dashboard-muted))]">
            Saúde da Instrumentação
          </span>
          <div className="mt-1">{renderTagStatus()}</div>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-muted))]">
            {tag_info.last_seen_at
              ? `Último sinal recebido em: ${new Date(tag_info.last_seen_at).toLocaleString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  dateStyle: 'short',
                  timeStyle: 'medium',
                })}`
              : 'Nenhuma telemetria recebida até o momento.'}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[hsl(var(--dashboard-muted))]">
          <span>Chave Pública:</span>
          <Badge variant="outline" className="font-mono">
            {tag_info.public_key ? `${tag_info.public_key.slice(0, 12)}...` : 'Pendente'}
          </Badge>
        </div>
      </div>

      {/* Snippet Code Box */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))] flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-600" />
              Snippet JavaScript Oficial
            </h3>
            <p className="text-xs text-[hsl(var(--dashboard-muted))]">
              Insira este script na seção <code className="text-xs font-mono">&lt;head&gt;</code> de todas as páginas do seu site.
            </p>
          </div>
          <Button
            type="button"
            variant={copied ? 'default' : 'outline'}
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 rounded-xl transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Snippet
              </>
            )}
          </Button>
        </div>

        <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto shadow-inner">
          <pre>{snippetCode}</pre>
        </div>

        <div className="text-xs text-[hsl(var(--dashboard-muted))] flex items-center gap-1.5 pt-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Carregamento assíncrono (<code className="font-mono">async</code>): não bloqueia a renderização nem atrasa o tempo de carregamento da sua página.
          </span>
        </div>
      </section>

      {/* Gestão de Domínios HTTPS Permitidos */}
      <section className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--dashboard-ink))] flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            Domínios HTTPS Autorizados
          </h3>
          <p className="text-xs text-[hsl(var(--dashboard-muted))]">
            Por segurança (CORS e anti-spoofing), a Tag Parceira só aceita eventos vindos de domínios previamente cadastrados e validados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="url"
            placeholder="https://exemplo.com.br"
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            className="max-w-md h-9 text-xs rounded-xl"
          />
          <Button type="button" size="sm" onClick={handleAddOrigin} className="h-9 gap-1 rounded-xl">
            <Plus className="h-4 w-4" />
            Adicionar Domínio
          </Button>
        </div>

        {originError && <p className="text-xs text-destructive">{originError}</p>}

        <div className="space-y-2 pt-2">
          {origins.length === 0 ? (
            <p className="text-xs text-[hsl(var(--dashboard-muted))] italic">
              Nenhum domínio autorizado no momento. Adicione a URL do seu site acima para permitir a comunicação da tag.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {origins.map((orig) => (
                <div
                  key={orig}
                  className="flex items-center gap-2 rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] px-3 py-1.5 text-xs font-mono"
                >
                  <Globe className="h-3.5 w-3.5 text-blue-600" />
                  <span>{orig}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOrigin(orig)}
                    className="text-[hsl(var(--dashboard-muted))] hover:text-destructive transition-colors ml-1"
                    aria-label={`Remover ${orig}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={handleSaveOrigins}
            disabled={isSaving}
            className="rounded-xl"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações de Domínio'}
          </Button>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" />
              Domínios salvos com sucesso!
            </span>
          )}
        </div>
      </section>

      {/* Guias de Instalação */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Guia HTML */}
        <article className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
            <Code2 className="h-4 w-4 text-blue-600" />
            Guia 1: Instalação Direta no HTML
          </div>
          <p className="text-xs text-[hsl(var(--dashboard-muted))] leading-relaxed">
            Cole o snippet dentro da tag <code className="font-mono text-xs">&lt;head&gt;</code> do arquivo base do seu site (ou no <code className="font-mono text-xs">layout.tsx</code> / <code className="font-mono text-xs">index.html</code>).
            O script detecta automaticamente a chegada do prospect e limpa o token <code className="font-mono text-xs">as_click_id</code> da URL sem recarregar a página.
          </p>
        </article>

        {/* Guia GTM */}
        <article className="rounded-2xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-panel))] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dashboard-ink))]">
            <Layers className="h-4 w-4 text-emerald-600" />
            Guia 2: Google Tag Manager (GTM)
          </div>
          <p className="text-xs text-[hsl(var(--dashboard-muted))] leading-relaxed">
            Crie uma tag do tipo <strong>HTML Personalizado</strong> no seu contêiner GTM, cole o snippet oficial e defina o acionador para <strong>Initialization - All Pages</strong> ou <strong>Consent Initialization</strong>.
            A tag se integra automaticamente ao Google Consent Mode v2 caso esteja ativo no contêiner.
          </p>
        </article>
      </div>
    </div>
  );
}
