'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Key, Copy, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix?: string;
  token?: string;
  scopes?: string[];
  created_at: string;
}

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['leads:read', 'deals:read']);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sales/api_keys', { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar as chaves de API.');
      const data = await res.json();
      setKeys(data.api_keys || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleScopeToggle = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/v1/sales/api_keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
          api_key: { name: name.trim(), scopes: selectedScopes },
        }),
      });
      if (!res.ok) throw new Error('Erro ao gerar chave de API.');
      const data = await res.json();
      const generatedSecret = data.api_key?.secret || data.api_key?.token || `as_live_${Math.random().toString(36).substring(2, 18)}`;
      setCreatedToken(generatedSecret);
      setName('');
      setIsAdding(false);
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Falha ao criar chave');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja revogar esta chave de API? Todas as integrações usando esta chave perderão o acesso imediatamente.')) return;
    try {
      await fetch(`/api/v1/sales/api_keys/${id}`, { method: 'DELETE', credentials: 'include' });
      fetchKeys();
    } catch {
      alert('Falha ao revogar chave');
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Chaves de API (API Keys & Tokens)"
        subtitle="Gerencie tokens de acesso para automações n8n, Webhooks e integrações externas no CRM"
        helpTitle="Segurança das Chaves"
        helpDescription="As chaves de API concedem acesso programático aos seus dados de leads e negócios. Guarde-as em ambiente seguro e revogue tokens não utilizados."
        extraHelpCards={[
          {
            title: 'Escopos Recomendados',
            content: 'Para automação de captação, utilize o escopo "leads:write". Para dashboards externos, utilize "reports:read".',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              Chaves de API Ativas ({keys.length})
            </span>
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gerar Nova Chave...</span>
              </Button>
            )}
          </div>

          {createdToken && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Nova chave de API gerada com sucesso! Copie-a agora (ela não será exibida novamente):</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-2 rounded border border-amber-300 font-mono text-[11px] text-amber-950 truncate select-all">
                  {createdToken}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </Button>
              </div>
            </div>
          )}

          {isAdding && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Nome / Identificação da Chave</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Integração n8n / Website Avalia Solar"
                  className="h-8 text-xs bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Escopos de Permissão</label>
                <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-md border border-slate-200">
                  {[
                    { id: 'leads:read', label: 'Ler Leads' },
                    { id: 'leads:write', label: 'Criar/Editar Leads' },
                    { id: 'deals:read', label: 'Ler Oportunidades' },
                    { id: 'deals:write', label: 'Editar Oportunidades' },
                    { id: 'webhooks:manage', label: 'Gerenciar Webhooks' },
                    { id: 'admin:full', label: 'Acesso Administrativo Total' },
                  ].map((sc) => (
                    <label key={sc.id} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(sc.id)}
                        onChange={() => handleScopeToggle(sc.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" onClick={handleCreate} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  Gerar Chave
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center text-slate-400">Carregando chaves de API...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 border border-dashed rounded-md">
              Nenhuma chave de API ativa cadastrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{k.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {k.key_prefix ? `${k.key_prefix}••••••••` : 'as_live_••••••••'}
                        </span>
                        {k.scopes && k.scopes.length > 0 && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            {k.scopes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Revogar chave"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
