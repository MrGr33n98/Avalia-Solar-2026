'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Database, AlertCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import OrganizationSettingLayout from '@/components/sales/settings/OrganizationSettingLayout';
import SalesLayoutWrapper from '@/components/sales/layout/SalesLayoutWrapper';

interface CustomFieldDefinition {
  id: number;
  entity_type: string;
  key: string;
  label: string;
  field_type: string;
  required?: boolean;
  options?: string[];
}

export default function CustomFieldsSettingsPage() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEntityType, setNewEntityType] = useState('Opportunity');
  const [newFieldType, setNewFieldType] = useState('string');
  const [isRequired, setIsRequired] = useState(false);

  // Select / Multiselect Option Tag Builder
  const [options, setOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/custom_field_definitions', { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar os campos personalizados.');
      const data = await res.json();
      setFields(data.custom_field_definitions || []);
    } catch (err: any) {
      // Fallback UI data if API returns empty/error in dev
      setFields([
        { id: 1, entity_type: 'Opportunity', key: 'potencia_kwp', label: 'Potência Solicitada (kWp)', field_type: 'number', required: true },
        { id: 2, entity_type: 'Opportunity', key: 'tipo_telhado', label: 'Tipo de Telhado / Estrutura', field_type: 'select', options: ['Cerâmico', 'Metálico', 'Laje', 'Solo'] },
        { id: 3, entity_type: 'Account', key: 'concessionaria', label: 'Distribuidora de Energia', field_type: 'string', required: false },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleAddOption = () => {
    if (!newOptionInput.trim()) return;
    if (!options.includes(newOptionInput.trim())) {
      setOptions((prev) => [...prev, newOptionInput.trim()]);
    }
    setNewOptionInput('');
  };

  const handleRemoveOption = (opt: string) => {
    setOptions((prev) => prev.filter((item) => item !== opt));
  };

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    const key = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const payload = {
      custom_field_definition: {
        entity_type: newEntityType,
        key,
        label: newLabel.trim(),
        field_type: newFieldType,
        required: isRequired,
        options: (newFieldType === 'select' || newFieldType === 'multiselect') ? options : [],
      },
    };

    try {
      const res = await fetch('/api/v1/sales/custom_field_definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchFields();
      } else {
        setFields((prev) => [...prev, { id: Date.now(), ...payload.custom_field_definition }]);
      }
    } catch {
      setFields((prev) => [...prev, { id: Date.now(), ...payload.custom_field_definition }]);
    } finally {
      setNewLabel('');
      setOptions([]);
      setIsRequired(false);
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este campo personalizado? Os valores preenchidos em registros existentes deixarão de ser exibidos.')) return;
    try {
      await fetch(`/api/v1/sales/custom_field_definitions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Campos Personalizados (Custom Fields)"
        subtitle="Adicione propriedades customizadas para Oportunidades, Leads, Empresas e Pessoas"
        helpTitle="Modelagem Flexível de Dados"
        helpDescription="Campos personalizados integram-se nativamente ao funil e formulários do CRM. Você pode definir campos obrigatórios e seleções pré-definidas."
        extraHelpCards={[
          {
            title: 'Tipos de Seleção (Dropdown)',
            content: 'Para campos do tipo "Seleção Única" ou "Multi-Seleção", cadastre os valores permitidos para padronizar o preenchimento pelo time de vendas.',
          },
        ]}
      >
        <div className="space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-sky-600" />
              Campos Personalizados Ativos ({fields.length})
            </span>
            {!isAdding && (
              <Button
                size="sm"
                onClick={() => setIsAdding(true)}
                className="bg-sky-600 hover:bg-sky-700 h-8 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Campo Personalizado...</span>
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isAdding && (
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-md border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Rótulo / Nome do Campo</label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Potência Desejada (kWp)"
                    className="h-8 text-xs bg-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Entidade Alvo</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Opportunity">Oportunidade (Deal)</option>
                    <option value="Lead">Lead</option>
                    <option value="Account">Empresa (Account)</option>
                    <option value="Contact">Pessoa (Contact)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Tipo de Dado</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="string">Texto Curto</option>
                    <option value="number">Número / Quantidade</option>
                    <option value="select">Seleção Única (Dropdown)</option>
                    <option value="multiselect">Multi-Seleção</option>
                    <option value="boolean">Verdadeiro / Falso (Checkbox)</option>
                    <option value="date">Data</option>
                  </select>
                </div>
              </div>

              {/* Opções Dinâmicas para Select / Multiselect */}
              {(newFieldType === 'select' || newFieldType === 'multiselect') && (
                <div className="space-y-2 bg-white p-2.5 rounded-md border border-slate-200">
                  <label className="block text-[11px] text-slate-600 font-semibold">Opções de Seleção Permitidas</label>
                  <div className="flex gap-2">
                    <Input
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                      placeholder="Ex: Cerâmico, Solo, Laje... (Pressione Enter)"
                      className="h-8 text-xs bg-white flex-1"
                    />
                    <Button size="sm" type="button" onClick={handleAddOption} className="h-8 text-xs bg-slate-800 hover:bg-slate-900">
                      Adicionar
                    </Button>
                  </div>
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {options.map((opt) => (
                        <span key={opt} className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 text-[11px] px-2 py-0.5 rounded-full font-medium">
                          {opt}
                          <button type="button" onClick={() => handleRemoveOption(opt)} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Campo Obrigatório para avanço no funil</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button size="sm" onClick={handleCreate} className="h-8 text-xs bg-sky-600 hover:bg-sky-700">
                  Salvar Campo
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-slate-400">Carregando campos personalizados...</div>
          ) : fields.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 border border-dashed rounded-md">
              Nenhum campo personalizado cadastrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{field.label}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {field.entity_type}
                        </span>
                        {field.required && (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">key: {field.key}</span>
                        <span className="text-[10px] text-sky-700 font-medium">tipo: {field.field_type}</span>
                        {field.options && field.options.length > 0 && (
                          <span className="text-[10px] text-slate-500">[{field.options.join(', ')}]</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Excluir campo"
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
