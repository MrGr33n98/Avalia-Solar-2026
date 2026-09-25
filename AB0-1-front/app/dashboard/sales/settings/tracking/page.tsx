'use client';

import { useEffect, useState } from 'react';
import { Activity, Copy, Check, Globe, UserCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

interface TrackingSite {
  configured: boolean;
  id?: number;
  public_key?: string;
  allowed_origins?: string[];
  active?: boolean;
  snippet_url?: string;
}

export default function SalesTrackingPage() {
  const [sessionId, setSessionId] = useState('');
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [site, setSite] = useState<TrackingSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/sales/tracking_sites', { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || data?.message || 'Falha ao carregar tracking.');
        return data.tracking_site as TrackingSite;
      })
      .then((result) => {
        if (!active) return;
        setSite(result);
        setDomains(result.allowed_origins || []);
      })
      .catch((error: Error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const trackingSnippet = site?.snippet_url
    ? `<script async src="${site.snippet_url}"></script>`
    : '';

  const identify = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/sales/tracking/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, contact_id: contactId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || data?.message || 'Erro ao associar identidade.');
      setMessage('Identidade associada com sucesso! Eventos anteriores vinculados ao contato.');
      setSessionId('');
      setContactId('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao associar identidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    try {
      const parsed = new URL(newDomainInput.includes('://') ? newDomainInput : `https://${newDomainInput}`);
      if (!['https:', 'http:'].includes(parsed.protocol) || (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))) {
        throw new Error('Use uma origem HTTPS válida. HTTP só é permitido em localhost.');
      }
      const origin = parsed.origin;
      if (!domains.includes(origin)) setDomains((prev) => [...prev, origin]);
      setNewDomainInput('');
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Origem inválida.');
    }
  };

  const handleRemoveDomain = (d: string) => {
    setDomains((prev) => prev.filter((item) => item !== d));
  };

  const saveDomains = async () => {
    setSavingDomains(true);
    setMessage(null);
    try {
      const response = await fetch(site?.id ? `/api/v1/sales/tracking_sites/${site.id}` : '/api/v1/sales/tracking_sites', {
        method: site?.id ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_site: { allowed_origins: domains } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || data?.message || 'Não foi possível salvar as origens.');
      setSite(data.tracking_site);
      setMessage('Origens autorizadas salvas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar as origens.');
    } finally {
      setSavingDomains(false);
    }
  };

  const rotateKey = async () => {
    if (!site?.id) return;
    setSavingDomains(true);
    try {
      const response = await fetch(`/api/v1/sales/tracking_sites/${site.id}/rotate_key`, {
        method: 'POST', credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || data?.message || 'Não foi possível rotacionar a chave.');
      setSite(data.tracking_site);
      setMessage('Chave rotacionada. Atualize o snippet instalado no site.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível rotacionar a chave.');
    } finally {
      setSavingDomains(false);
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Rastreamento Web & Atribuição de Leads (Web Tracking)"
        subtitle="Configure origens web, capture eventos allowlisted e associe sessão a contato por ação autenticada no CRM"
        helpTitle="Atribuição Multi-Toque"
        helpDescription="O snippet registra páginas, formulários e UTMs permitidos para este tenant. Ele não identifica automaticamente uma pessoa nem prova conversão comercial."
        extraHelpCards={[
          {
            title: 'Instalação Simples',
            content: 'Configure e salve uma origem autorizada antes de instalar o snippet no site.',
          },
        ]}
      >
        <div className="space-y-6 font-sans text-xs">
          {/* Seção 1: Snippet JS de Rastreamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-600" />
                Pixel de Rastreamento JavaScript (Snippet)
              </span>
            </div>

            {loading ? <p className="text-slate-500">Carregando configuração…</p> : site?.configured && trackingSnippet ? <div className="p-3.5 bg-slate-900 rounded-md text-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-sky-400">código de inserção no site (&lt;head&gt;)</span>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingSnippet);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-7 text-xs bg-sky-600 hover:bg-sky-700 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Pixel'}</span>
                </Button>
              </div>
              <pre className="font-mono text-[10px] leading-relaxed overflow-x-auto text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                {trackingSnippet}
              </pre>
            </div> : <p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">Adicione uma origem e salve para gerar a chave e o snippet deste tenant.</p>}
          </div>

          {/* Seção 2: Domínios Autorizados */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-600" />
                Domínios Autorizados para Captura ({domains.length})
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDomain(); } }}
                placeholder="Ex: solar.minhaempresa.com.br"
                className="h-8 text-xs bg-white flex-1"
              />
              <Button size="sm" onClick={handleAddDomain} className="h-8 text-xs bg-slate-800 hover:bg-slate-900">
                Adicionar Domínio
              </Button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
              {domains.map((d) => (
                <div key={d} className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors">
                  <span className="font-mono text-slate-800 font-medium">{d}</span>
                  <button
                    onClick={() => handleRemoveDomain(d)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Remover domínio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={saveDomains} disabled={savingDomains || loading || domains.length === 0} className="h-8 text-xs">
                {savingDomains ? 'Salvando…' : site?.configured ? 'Salvar origens' : 'Criar configuração'}
              </Button>
              {site?.configured && <Button size="sm" variant="outline" onClick={rotateKey} disabled={savingDomains} className="h-8 text-xs">
                Rotacionar chave
              </Button>}
              {message && <span role="status" className="text-xs font-medium text-slate-700">{message}</span>}
            </div>
          </div>

          {/* Seção 3: Associação de Identidade (Navegação Anônima -> Contato) */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-600" />
                Associar Sessão Anônima a Contato Existente
              </span>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">ID da Sessão (Session Token)</label>
                  <Input
                    value={sessionId}
                    onChange={(event) => setSessionId(event.target.value)}
                    placeholder="Ex: sess_9842a1b7..."
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">ID do Contato no CRM</label>
                  <Input
                    value={contactId}
                    onChange={(event) => setContactId(event.target.value)}
                    placeholder="Ex: 402"
                    className="h-8 text-xs bg-white font-mono"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  onClick={identify}
                  disabled={saving || !sessionId || !contactId}
                  size="sm"
                  className="h-8 text-xs bg-sky-600 hover:bg-sky-700"
                >
                  {saving ? 'Associando…' : 'Associar Contato à Navegação'}
                </Button>
                {message && <span role="status" className="text-xs font-medium text-slate-700">{message}</span>}
              </div>
            </div>
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
