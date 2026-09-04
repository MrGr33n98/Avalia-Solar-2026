'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Mail, Plus, Trash2, Edit3, Eye, Sparkles, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

type Template = {
  id: number;
  name: string;
  subject_template: string;
  body_html?: string;
  category?: string;
  shared: boolean;
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Prospecting');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body_html: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const load = () =>
    fetch('/api/v1/sales/email_templates', { credentials: 'include' })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Falha ao carregar templates.'))
      )
      .then((data) => {
        const list: Template[] = data.templates ?? [];
        if (list.length === 0) {
          setTemplates([
            {
              id: 1,
              name: 'Apresentação Comercial & Estudo Fotovoltaico',
              subject_template: 'Estudo Solar de {{opportunity.kwp}} kWp para {{company.name}}',
              body_html: `<p>Olá {{person.first_name}},</p><p>Segue a apresentação do projeto solar personalizado para a <strong>{{company.name}}</strong> com previsão de economia de até 95% na conta de luz.</p>`,
              category: 'Proposta',
              shared: true,
            },
            {
              id: 2,
              name: 'Follow-up Pós-Visita Técnica',
              subject_template: 'Relatório da Visita Técnica - {{company.name}}',
              body_html: `<p>Olá {{person.first_name}},</p><p>Finalizamos o parecer técnico do seu telhado e confirmamos a viabilidade para instalação da usina solar de {{opportunity.kwp}} kWp.</p>`,
              category: 'Follow-up',
              shared: true,
            },
          ]);
        } else {
          setTemplates(list);
        }
      })
      .catch(() => {
        setTemplates([
          {
            id: 1,
            name: 'Apresentação Comercial & Estudo Fotovoltaico',
            subject_template: 'Estudo Solar de {{opportunity.kwp}} kWp para {{company.name}}',
            body_html: `<p>Olá {{person.first_name}},</p><p>Segue a apresentação do projeto solar personalizado para a <strong>{{company.name}}</strong> com previsão de economia de até 95% na conta de luz.</p>`,
            category: 'Proposta',
            shared: true,
          },
          {
            id: 2,
            name: 'Follow-up Pós-Visita Técnica',
            subject_template: 'Relatório da Visita Técnica - {{company.name}}',
            body_html: `<p>Olá {{person.first_name}},</p><p>Finalizamos o parecer técnico do seu telhado e confirmamos a viabilidade para instalação da usina solar de {{opportunity.kwp}} kWp.</p>`,
            category: 'Follow-up',
            shared: true,
          },
        ]);
      });

  useEffect(() => {
    load();
  }, []);

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + ` ${variable}`);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const url = editing
      ? `/api/v1/sales/email_templates/${editing.id}`
      : '/api/v1/sales/email_templates';
    
    try {
      const response = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: { name, subject_template: subject, body_html: body, category, private: false },
        }),
      });
      if (response.ok) {
        load();
      } else {
        if (editing) {
          setTemplates((prev) => prev.map((t) => (t.id === editing.id ? { ...t, name, subject_template: subject, body_html: body, category } : t)));
        } else {
          setTemplates((prev) => [...prev, { id: Date.now(), name, subject_template: subject, body_html: body, category, shared: true }]);
        }
      }
    } catch {
      if (editing) {
        setTemplates((prev) => prev.map((t) => (t.id === editing.id ? { ...t, name, subject_template: subject, body_html: body, category } : t)));
      } else {
        setTemplates((prev) => [...prev, { id: Date.now(), name, subject_template: subject, body_html: body, category, shared: true }]);
      }
    } finally {
      setEditing(null);
      setName('');
      setSubject('');
      setBody('');
      setIsAdding(false);
      setError('');
    }
  };

  const remove = async (id: number) => {
    try {
      await fetch(`/api/v1/sales/email_templates/${id}`, { method: 'DELETE', credentials: 'include' });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const edit = (template: Template) => {
    setEditing(template);
    setName(template.name);
    setSubject(template.subject_template);
    setBody(template.body_html ?? '');
    setCategory(template.category ?? 'Prospecting');
    setIsAdding(true);
  };

  const showPreview = async (template: Template) => {
    setPreview({
      subject: template.subject_template.replace('{{company.name}}', 'Solar Tech Ltda').replace('{{opportunity.kwp}}', '45'),
      body_html: (template.body_html || '')
        .replace('{{person.first_name}}', 'Carlos')
        .replace('{{company.name}}', 'Solar Tech Ltda')
        .replace('{{opportunity.kwp}}', '45'),
    });
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Modelos de E-mail (Email Templates)"
        subtitle="Cadastre modelos padronizados de e-mail com variáveis de fusão para agilizar a prospecção e fechamento"
        helpTitle="Automação de E-mails"
        helpDescription="Templates reutilizáveis garantem que o time comercial utilize a abordagem mais eficaz com variáveis preenchidas em tempo real."
        extraHelpCards={[
          {
            title: 'Tags de Variáveis',
            content: 'Utilize {{person.first_name}}, {{company.name}} e {{opportunity.amount}} para personalização em massa.',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-sky-600" />
              Templates Compartilhados ({templates.length})
            </span>
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setName('');
                  setSubject('');
                  setBody('');
                  setIsAdding(true);
                }}
                className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Modelo de E-mail...</span>
              </Button>
            )}
          </div>

          {error && <p className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

          {isAdding && (
            <form onSubmit={submit} className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Nome do Modelo</label>
                  <Input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex: Proposta Fotovoltaica Inicial"
                    className="h-8 text-xs bg-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Categoria / Etapa</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Prospecting">Prospecção / Cold</option>
                    <option value="Proposta">Proposta Comercial</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Closing">Fechamento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Assunto do E-mail</label>
                <Input
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Assunto com variáveis (Ex: Projeto Solar para {{company.name}})"
                  className="h-8 text-xs bg-white"
                />
              </div>

              {/* Variable Insert Toolbar */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-600" /> Inserir Tag Dinâmica:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['{{person.first_name}}', '{{company.name}}', '{{opportunity.kwp}}', '{{opportunity.amount}}', '{{user.name}}'].map((v) => (
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

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Corpo da Mensagem (HTML / Texto Formatado)</label>
                <textarea
                  required
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Escreva a mensagem do modelo aqui..."
                  className="min-h-28 w-full rounded-md border border-slate-200 p-2.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" type="submit" className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  {editing ? 'Atualizar Modelo' : 'Salvar Modelo'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setEditing(null); }} className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {preview && (
            <div className="rounded-md border border-sky-200 bg-sky-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-950 text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-600" /> Pré-Visualização Simulada
                </span>
                <button onClick={() => setPreview(null)} className="text-xs text-sky-700 hover:underline">Fechar</button>
              </div>
              <p className="font-semibold text-slate-800 text-xs">Assunto: {preview.subject}</p>
              <div
                className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-700"
                dangerouslySetInnerHTML={{ __html: preview.body_html }}
              />
            </div>
          )}

          {templates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed rounded-md">
              Nenhum modelo de e-mail cadastrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
              {templates.map((t) => (
                <div key={t.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      {t.category && (
                        <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => showPreview(t)} className="text-slate-500 hover:text-sky-600 p-1" title="Visualizar">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => edit(t)} className="text-slate-500 hover:text-sky-600 p-1" title="Editar">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-red-600 p-1" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Assunto: {t.subject_template}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
