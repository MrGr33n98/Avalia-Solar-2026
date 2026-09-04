'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Database, AlertCircle } from 'lucide-react';
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
}

export default function CustomFieldsSettingsPage() {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEntityType, setNewEntityType] = useState('Account');
  const [newFieldType, setNewFieldType] = useState('string');

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/sales/custom_field_definitions', { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar os campos personalizados.');
      const data = await res.json();
      setFields(data.custom_field_definitions || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar à API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    const key = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    try {
      const res = await fetch('/api/v1/sales/custom_field_definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          custom_field_definition: {
            entity_type: newEntityType,
            key,
            label: newLabel.trim(),
            field_type: newFieldType,
            required: false,
          },
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar campo personalizado.');
      setNewLabel('');
      setIsAdding(false);
      fetchFields();
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este campo personalizado?')) return;
    try {
      const res = await fetch(`/api/v1/sales/custom_field_definitions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir campo.');
      fetchFields();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir');
    }
  };

  return (
    <SalesLayoutWrapper>
      <OrganizationSettingLayout
        title="Custom Fields"
        subtitle="Defina campos personalizados para Empresas, Pessoas, Leads e Oportunidades"
        helpTitle="O que são campos personalizados?"
        helpDescription="Campos personalizados permitem adicionar propriedades de dados específicas do seu processo comercial aos registros do CRM."
      >
        <div className="space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-700">Campos Personalizados ({fields.length})</span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo campo personalizado...</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isAdding && (
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border border-slate-200 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Rótulo / Nome</label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Potência Desejada (kWp)"
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Entidade Alvo</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Account">Empresa (Account)</option>
                    <option value="Contact">Pessoa (Contact)</option>
                    <option value="Lead">Lead</option>
                    <option value="Opportunity">Oportunidade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Tipo de Campo</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="string">Texto curto</option>
                    <option value="number">Número</option>
                    <option value="boolean">Verdadeiro / Falso</option>
                    <option value="date">Data</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
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
            <div className="p-8 text-center text-xs text-slate-400">Carregando campos...</div>
          ) : fields.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50/50 border border-dashed rounded-md">
              Nenhum campo personalizado cadastrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">{field.label}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({field.entity_type} • {field.field_type})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
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
