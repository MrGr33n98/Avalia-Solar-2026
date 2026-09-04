'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix?: string;
  token?: string;
  created_at: string;
}

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
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

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/v1/sales/api_keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ api_key: { name: name.trim() } }),
      });
      if (!res.ok) throw new Error('Erro ao gerar chave de API.');
      const data = await res.json();
      setCreatedToken(data.api_key?.token || 'as_live_secret_key');
      setName('');
      setIsAdding(false);
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Falha ao criar chave');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja revogar esta chave de API?')) return;
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
        title="API Keys"
        subtitle="Gerencie chaves de API secretas para integração com o CRM Avalia Solar"
        helpTitle="Segurança das Chaves"
        helpDescription="As chaves de API permitem acesso programático aos seus dados. Guarde suas chaves secretas em ambiente seguro."
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-700">Chaves de API Ativas ({keys.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gerar nova chave...</span>
              </button>
            )}
          </div>

          {createdToken && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
              <span className="font-semibold text-amber-900 block">Nova chave gerada! Copie-a agora:</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-1.5 rounded border border-amber-300 font-mono text-[11px] text-amber-950 truncate">
                  {createdToken}
                </code>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {isAdding && (
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Integração Zapier / Website"
                className="h-8 text-xs bg-white"
                autoFocus
              />
              <Button size="sm" onClick={handleCreate} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                Gerar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                Cancelar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center text-slate-400">Carregando chaves de API...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 border border-dashed rounded-md">
              Nenhuma chave de API gerada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{k.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {k.key_prefix ? `${k.key_prefix}••••••••` : 'as_live_••••••••'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(k.id)} className="text-slate-400 hover:text-red-600 p-1">
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
