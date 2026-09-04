'use client';

import { useState } from 'react';
import { Activity, Copy, Check, ShieldCheck, Globe, UserCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

export default function SalesTrackingPage() {
  const [sessionId, setSessionId] = useState('');
  const [contactId, setContactId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Whitelisted Domains
  const [domains, setDomains] = useState<string[]>([
    'www.avaliasolar.com.br',
    'simulador.avaliasolar.com.br',
  ]);
  const [newDomainInput, setNewDomainInput] = useState('');

  const trackingSnippet = `<!-- Avalia Solar Web Tracking Pixel -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'avalia.start':
  new Date().getTime(),event:'avalia.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='avalia'?'&l='+l:'';j.async=true;
  j.src='https://crm.avaliasolar.com.br/pixel.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','avaliaLayer','AS-PIXEL-2026-LIVE');
</script>`;

  const identify = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/sales/tracking/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracking_session_id: sessionId, sales_contact_id: contactId }),
      });
      if (!response.ok) throw new Error();
      setMessage('Identidade associada com sucesso! Eventos anteriores vinculados ao contato.');
      setSessionId('');
      setContactId('');
    } catch {
      setMessage('Erro ao associar identidade.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const cleanDomain = newDomainInput.trim().replace(/^https?:\/\//, '');
    if (!domains.includes(cleanDomain)) {
      setDomains((prev) => [...prev, cleanDomain]);
    }
    setNewDomainInput('');
  };

  const handleRemoveDomain = (d: string) => {
    setDomains((prev) => prev.filter((item) => item !== d));
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Rastreamento Web & Atribuição de Leads (Web Tracking)"
        subtitle="Monitore a jornada digital dos clientes no seu site institucional e atribua navegação anônima a contatos do CRM"
        helpTitle="Atribuição Multi-Toque"
        helpDescription="O Pixel do Avalia Solar captura UTMs de campanhas (Google Ads, Meta Ads), páginas visitadas e simulações solares para atribuir a origem exata da venda."
        extraHelpCards={[
          {
            title: 'Instalação Simples',
            content: 'Cole o snippet de rastreamento na tag <head> do seu site ou via Google Tag Manager (GTM).',
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

            <div className="p-3.5 bg-slate-900 rounded-md text-slate-100 space-y-2.5">
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
            </div>
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
                {message && <span className="text-xs font-medium text-emerald-700">{message}</span>}
              </div>
            </div>
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
