import React, { useState } from 'react';
import { CreatorTreeSettings } from '@/types/creator-tree';
import { Search, Activity, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TreeSettingsPanelProps {
  settings: CreatorTreeSettings;
  onUpdate: (payload: Partial<CreatorTreeSettings>) => Promise<CreatorTreeSettings>;
}

export function TreeSettingsPanel({ settings, onUpdate }: TreeSettingsPanelProps) {
  const [config, setConfig] = useState(settings.config || {});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate({ config });
      toast.success('Configurações salvas com sucesso.');
    } catch {
      toast.error('Erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SEO Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="grid place-items-center h-8 w-8 rounded-lg bg-blue-50 text-blue-600">
            <Search className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">SEO (Busca)</h3>
        </div>
        <div className="space-y-3 pl-10">
          <label className="block text-xs font-bold text-slate-700">
            Título da página
            <input 
              value={config.seo_title || ''} 
              onChange={(e) => handleChange('seo_title', e.target.value)}
              placeholder="Meu Nome - Links Rápidos" 
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Descrição (Meta tag)
            <textarea 
              value={config.seo_description || ''} 
              onChange={(e) => handleChange('seo_description', e.target.value)}
              placeholder="Conheça meu trabalho, portfólio e serviços..." 
              className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
