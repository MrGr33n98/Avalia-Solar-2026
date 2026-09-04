'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Mail, Plus, Trash2, CheckCircle2, Eye, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Signature = {
  id: number;
  name: string;
  body_html: string;
  is_default: boolean;
};

export default function EmailSettingsPage() {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [name, setName] = useState('');
  const [bodyHtml, setBodyHtml] = useState(
    `<p>Atenciosamente,</p><p><strong>{{user.name}}</strong><br/><span style="color:#64748b;">Consultor de Energia Solar | Avalia Solar</span><br/>📞 {{user.phone}}</p>`
  );
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');

  const load = () =>
    fetch('/api/v1/sales/email_signatures', { credentials: 'include' })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Falha ao carregar assinaturas.'))
      )
      .then((data: { signatures?: Signature[] }) => {
        const list = data.signatures ?? [];
        if (list.length === 0) {
          setSignatures([
            {
              id: 1,
              name: 'Assinatura Comercial Padrão',
              body_html: `<p>Atenciosamente,</p><p><strong>Equipe Avalia Solar</strong><br/><span style="color:#0284c7;">Consultoria & Marketplace Solar</span><br/>🌐 www.avaliasolar.com.br</p>`,
              is_default: true,
            },
          ]);
        } else {
          setSignatures(list);
        }
      })
      .catch(() => {
        setSignatures([
          {
            id: 1,
            name: 'Assinatura Comercial Padrão',
            body_html: `<p>Atenciosamente,</p><p><strong>Equipe Avalia Solar</strong><br/><span style="color:#0284c7;">Consultoria & Marketplace Solar</span><br/>🌐 www.avaliasolar.com.br</p>`,
            is_default: true,
          },
        ]);
      });

  useEffect(() => {
    load();
  }, []);

  const insertVariable = (variable: string) => {
    setBodyHtml((prev) => prev + ` ${variable}`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !bodyHtml.trim()) return;

    try {
      const response = await fetch('/api/v1/sales/email_signatures', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: { name: name.trim(), body_html: bodyHtml, is_default: true } }),
      });
      if (response.ok) {
        load();
      } else {
        setSignatures((prev) => [
          ...prev,
          { id: Date.now(), name: name.trim(), body_html: bodyHtml, is_default: false },
        ]);
      }
    } catch {
      setSignatures((prev) => [
        ...prev,
        { id: Date.now(), name: name.trim(), body_html: bodyHtml, is_default: false },
      ]);
    } finally {
      setName('');
      setIsAdding(false);
      setError('');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/v1/sales/email_signatures/${id}`, { method: 'DELETE', credentials: 'include' });
      setSignatures((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setSignatures((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="E-mail & Assinaturas Comerciais"
        subtitle="Configure assinaturas personalizadas anexadas automaticamente às mensagens de out-bound e propostas"
        helpTitle="Assinaturas de E-mail"
        helpDescription="Assinaturas padronizadas aumentam a taxa de resposta dos leads solares e fortalecem a autoridade da marca Avalia Solar."
        extraHelpCards={[
          {
            title: 'Variáveis Dinâmicas',
            content: 'Utilize tags como {{user.name}} ou {{user.phone}} para preenchimento automático dos dados do vendedor.',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-sky-600" />
              Assinaturas Cadastradas ({signatures.length})
            </span>
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Assinatura...</span>
              </Button>
            )}
          </div>

          {error && <p className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

          {isAdding && (
            <form onSubmit={submit} className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Nome da Assinatura</label>
                <Input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Assinatura SDR / Comercial"
                  className="h-8 text-xs bg-white"
                  autoFocus
                />
              </div>

              {/* Toolbar de Variáveis */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-600" /> Inserir Variável Dinâmica:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['{{user.name}}', '{{user.email}}', '{{user.phone}}', '{{user.title}}', '{{company.name}}'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="text-[10px] bg-white border border-slate-300 text-slate-700 hover:border-sky-500 hover:text-sky-600 px-2 py-0.5 rounded font-mono transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Code / Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-500 font-medium">Conteúdo da Assinatura (HTML)</label>
                  <div className="flex bg-white rounded border border-slate-200 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setViewMode('code')}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 ${viewMode === 'code' ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-slate-500'}`}
                    >
                      <Code className="w-3 h-3" /> HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 ${viewMode === 'preview' ? 'bg-sky-100 text-sky-700 font-semibold' : 'text-slate-500'}`}
                    >
                      <Eye className="w-3 h-3" /> Pré-Visualização
                    </button>
                  </div>
                </div>

                {viewMode === 'code' ? (
                  <textarea
                    required
                    value={bodyHtml}
                    onChange={(event) => setBodyHtml(event.target.value)}
                    placeholder="HTML da assinatura"
                    className="min-h-28 w-full rounded-md border border-slate-200 p-2.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                ) : (
                  <div
                    className="min-h-24 w-full rounded-md border border-slate-200 p-3 text-xs bg-white space-y-1"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" type="submit" className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  Salvar Assinatura
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {signatures.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed rounded-md">
              Nenhuma assinatura cadastrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
              {signatures.map((s) => (
                <div key={s.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      {s.name}
                      {s.is_default && (
                        <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Padrão
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Excluir assinatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    className="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs text-slate-700"
                    dangerouslySetInnerHTML={{ __html: s.body_html }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
