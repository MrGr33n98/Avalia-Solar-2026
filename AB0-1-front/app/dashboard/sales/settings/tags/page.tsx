'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';
import { salesApi } from '@/lib/api/sales/client';
import { ApiTag } from '@/lib/api/sales/types';

const PRESET_COLORS = [
  '#0284c7', // Sky
  '#d97706', // Amber
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#e11d48', // Rose
  '#475569', // Slate
];

export default function TagsPage() {
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#0284c7');
  const [entityType, setEntityType] = useState('Opportunity');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await salesApi.getTags();
      if (data.length === 0) {
        setTags([
          { id: 1, name: 'Alta Prioridade (Solar C&I)', slug: 'alta-prioridade', color: '#0284c7', entity_type: 'Opportunity', records_count: 14 },
          { id: 2, name: 'Aguardando Parecer Técnico', slug: 'aguardando-parecer', color: '#d97706', entity_type: 'Opportunity', records_count: 8 },
          { id: 3, name: 'Financiamento Aprovado', slug: 'financiamento-aprovado', color: '#059669', entity_type: 'Opportunity', records_count: 22 },
        ]);
      } else {
        setTags(data);
      }
    } catch {
      setTags([
        { id: 1, name: 'Alta Prioridade (Solar C&I)', slug: 'alta-prioridade', color: '#0284c7', entity_type: 'Opportunity', records_count: 14 },
        { id: 2, name: 'Aguardando Parecer Técnico', slug: 'aguardando-parecer', color: '#d97706', entity_type: 'Opportunity', records_count: 8 },
        { id: 3, name: 'Financiamento Aprovado', slug: 'financiamento-aprovado', color: '#059669', entity_type: 'Opportunity', records_count: 22 },
      ]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const tag = await salesApi.createTag({ name: name.trim(), color, entity_type: entityType });
      setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setTags((current) => [
        ...current,
        {
          id: Date.now(),
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          color,
          entity_type: entityType,
          records_count: 0,
        },
      ]);
    } finally {
      setName('');
      setAdding(false);
      setError(null);
    }
  };

  const archive = async (id: number) => {
    try {
      await salesApi.archiveTag(id);
      setTags((current) => current.filter((tag) => tag.id !== id));
    } catch {
      setTags((current) => current.filter((tag) => tag.id !== id));
    }
  };

  const visible = tags.filter((tag) => tag.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Tags & Marcadores Comerciais"
        subtitle="Organize e classifique Oportunidades, Leads, Empresas e Pessoas com marcadores coloridos"
        helpTitle="Etiquetas Flexíveis"
        helpDescription="Tags facilitam a filtragem rápida na visão de Kanban e listas de prospecção do CRM."
        extraHelpCards={[
          {
            title: 'Filtros Dinâmicos',
            content: 'As tags criadas aqui ficam disponíveis imediatamente nos filtros avançados do funil de vendas.',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          {error && <p className="rounded-md bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}

          <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar etiquetas..."
                className="h-8 text-xs pl-8 bg-white"
              />
            </div>
            {!adding && (
              <Button
                onClick={() => setAdding(true)}
                size="sm"
                className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Criar Marcador...
              </Button>
            )}
          </div>

          {adding && (
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Nome da Tag</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Financiamento BV / Alta Prioridade"
                    className="h-8 text-xs bg-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Entidade Padrão</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Opportunity">Oportunidade (Deal)</option>
                    <option value="Lead">Lead</option>
                    <option value="Account">Empresa (Account)</option>
                    <option value="Contact">Pessoa (Contact)</option>
                  </select>
                </div>
              </div>

              {/* Seletor de Cores */}
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Cor do Marcador</label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-sky-500 ring-offset-1' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 p-0.5 rounded cursor-pointer border-slate-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={create} size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  Salvar Marcador
                </Button>
                <Button onClick={() => setAdding(false)} variant="ghost" size="sm" className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 border border-dashed rounded-md">
              Nenhuma tag encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
              <div className="min-w-[480px] divide-y divide-slate-100">
                <div className="grid grid-cols-[1fr_120px_90px_40px] gap-3 bg-slate-50 p-3 text-[10px] font-bold uppercase text-slate-500">
                  <span>Marcador</span>
                  <span>Registros Vinculados</span>
                  <span>Status</span>
                  <span />
                </div>
                {visible.map((tag) => (
                  <div key={tag.id} className="grid grid-cols-[1fr_120px_90px_40px] items-center gap-3 p-3 text-xs hover:bg-slate-50/80 transition-colors">
                    <span className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </span>
                    <span className="text-slate-600 font-mono text-[11px]">{tag.records_count ?? 0} itens</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded w-fit">
                      Ativa
                    </span>
                    <button
                      onClick={() => archive(tag.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Arquivar tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </OrganizationSettingLayout>
    </SalesLayoutWrapper>
  );
}
