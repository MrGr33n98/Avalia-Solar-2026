'use client';

import { useEffect, useState } from 'react';
import { Building2, Save, CheckCircle2, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Taxonomy = { id: number; kind: string; name: string; slug: string };

export default function SalesSettingsPage() {
  const [items, setItems] = useState<Taxonomy[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  // Organization Form State
  const [companyName, setCompanyName] = useState('Avalia Solar Energia Sustentável');
  const [cnpj, setCnpj] = useState('48.192.304/0001-92');
  const [currency, setCurrency] = useState('BRL (R$)');
  const [timezone, setTimezone] = useState('America/Sao_Paulo (UTC-3)');
  const [targetMonthlyRevenue, setTargetMonthlyRevenue] = useState('1500000');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/sales/taxonomies', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Falha ao carregar taxonomias.');
        return response.json();
      })
      .then((data) => {
        setItems(data.taxonomies ?? []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    }, 600);
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Configurações Gerais & Perfil da Organização"
        subtitle="Gerencie os parâmetros globais da empresa, moeda, fuso horário e taxonomias do Avalia Solar CRM"
        helpTitle="Perfil da Organização"
        helpDescription="As configurações aqui definidas aplicam-se a todos os orçamentos, propostas e notificações emitidas no CRM."
        extraHelpCards={[
          {
            title: 'Taxonomias Canônicas',
            content: 'Taxonomias categorizam empresas, leads e produtos em toda a plataforma. Cadastre tipos de empresa, mercados e territórios nas sub-abas ao lado.',
          },
          {
            title: 'Integração via API',
            content: 'Todas as taxonomias e dados institucionais são servidos diretamente via /api/v1/sales/taxonomies.',
          },
        ]}
      >
        <div className="space-y-6 font-sans text-xs">
          {/* Form Perfil da Empresa */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                Dados Institucionais da Empresa
              </span>
              {savedSuccess && (
                <span className="text-emerald-600 font-medium flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Razão Social / Nome da Empresa</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">CNPJ</label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Moeda Padronizada</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="BRL (R$)">Real Brasileiro (R$ - BRL)</option>
                  <option value="USD ($)">Dólar Americano ($ - USD)</option>
                  <option value="EUR (€)">Euro (€ - EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Fuso Horário Operacional</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="America/Sao_Paulo (UTC-3)">Brasília / São Paulo (UTC-3)</option>
                  <option value="America/Manaus (UTC-4)">Manaus (UTC-4)</option>
                  <option value="America/Noronha (UTC-2)">Fernando de Noronha (UTC-2)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Meta de Faturamento Mensal do Funil (R$)</label>
                <Input
                  type="number"
                  value={targetMonthlyRevenue}
                  onChange={(e) => setTargetMonthlyRevenue(e.target.value)}
                  className="h-8 text-xs bg-white font-mono"
                  placeholder="Ex: 1500000"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={saving} size="sm" className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>

          {/* Seção de Taxonomias Ativas */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                Taxonomias Ativas no Sistema ({items.length})
              </span>
            </div>

            {state === 'loading' && <p className="py-6 text-center text-xs text-slate-400">Carregando taxonomias...</p>}
            {state === 'error' && <p className="py-6 text-center text-xs text-red-600">Erro ao obter taxonomias da API.</p>}
            {state === 'ready' && items.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500 bg-slate-50 border border-dashed rounded-md">
                Nenhuma taxonomia cadastrada. Utilize as sub-abas laterais para adicionar categorias.
              </p>
            )}

            {state === 'ready' && items.length > 0 && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-200 p-2.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                      {item.kind}
                    </span>
                    <p className="mt-1 font-semibold text-xs text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.slug}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
