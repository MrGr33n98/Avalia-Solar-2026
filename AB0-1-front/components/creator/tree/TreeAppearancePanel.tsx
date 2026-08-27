import React, { useState } from 'react';
import { CreatorTreeTheme, CreatorTreeAppearance } from '@/types/creator-tree';
import { reviewerTreeSettingsApi } from '@/lib/api/creatorTree';
import { toast } from 'sonner';
import { Check, Image as ImageIcon, PaintBucket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeAppearancePanelProps {
  initialTheme: CreatorTreeTheme | string;
  initialAppearance: CreatorTreeAppearance;
  onUpdate: (settings: { theme_key: string; appearance: CreatorTreeAppearance }) => void;
}

const THEMES: Array<{ key: CreatorTreeTheme; label: string; bgClass: string }> = [
  { key: 'solar', label: 'Solar Light', bgClass: 'bg-slate-50 border-slate-200' },
  { key: 'dark', label: 'Dark Mode', bgClass: 'bg-slate-900 border-slate-700' },
  { key: 'glass', label: 'Glassmorphism', bgClass: 'bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 border-purple-300' },
  { key: 'neo', label: 'Neo Dark', bgClass: 'bg-indigo-950 border-indigo-800' },
  { key: 'monochrome', label: 'Monochrome', bgClass: 'bg-white border-gray-300' },
];

export function TreeAppearancePanel({ initialTheme, initialAppearance, onUpdate }: TreeAppearancePanelProps) {
  const [themeKey, setThemeKey] = useState<string>(initialTheme || 'solar');
  const [appearance, setAppearance] = useState<CreatorTreeAppearance>(initialAppearance || {});
  const [saving, setSaving] = useState(false);

  const saveSettings = async (newThemeKey: string, newAppearance: CreatorTreeAppearance) => {
    try {
      setSaving(true);
      await reviewerTreeSettingsApi.update({
        theme_key: newThemeKey,
        appearance: newAppearance,
      });
      onUpdate({ theme_key: newThemeKey, appearance: newAppearance });
      toast.success('Aparência atualizada!');
    } catch {
      toast.error('Erro ao salvar aparência.');
      // Revert state if failed
      setThemeKey(initialTheme);
      setAppearance(initialAppearance);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (key: string) => {
    setThemeKey(key);
    // When switching to a preset theme, we clear custom background to let the theme shine
    const newAppearance = { ...appearance };
    delete newAppearance.background;
    setAppearance(newAppearance);
    void saveSettings(key, newAppearance);
  };

  const handleButtonStyleChange = (variant: 'solid' | 'outline' | 'glass') => {
    const newAppearance = {
      ...appearance,
      buttonStyle: { ...(appearance.buttonStyle || { rounding: 'lg' }), variant },
    };
    setAppearance(newAppearance);
    void saveSettings(themeKey, newAppearance);
  };

  const handleButtonRoundingChange = (rounding: 'none' | 'sm' | 'md' | 'lg' | 'full') => {
    const newAppearance = {
      ...appearance,
      buttonStyle: { ...(appearance.buttonStyle || { variant: 'solid' }), rounding },
    };
    setAppearance(newAppearance);
    void saveSettings(themeKey, newAppearance);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Themes */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-600 mb-3">Temas Prontos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.key}
              onClick={() => handleThemeChange(theme.key)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                theme.bgClass,
                themeKey === theme.key ? "ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md" : "hover:scale-105 opacity-80 hover:opacity-100"
              )}
            >
              {themeKey === theme.key && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white p-1 rounded-full shadow-sm z-10">
                  <Check className="w-3 h-3" />
                </div>
              )}
              <div className="w-8 h-8 rounded-full border border-black/10 shadow-inner bg-white/50 mb-2"></div>
              <span className={cn("text-[10px] font-bold", theme.key === 'dark' || theme.key === 'neo' ? 'text-white' : 'text-slate-800')}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Button Styles */}
      <section>
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-600 mb-3">Estilo dos Botões</h3>
        
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">Preenchimento</p>
          <div className="flex gap-2">
            {[
              { id: 'solid', label: 'Sólido' },
              { id: 'outline', label: 'Contorno' },
              { id: 'glass', label: 'Glass' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => handleButtonStyleChange(v.id as any)}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg border",
                  (appearance.buttonStyle?.variant || 'solid') === v.id
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Arredondamento</p>
          <div className="flex gap-2">
            {[
              { id: 'none', label: 'Quadrado', radius: 'rounded-none' },
              { id: 'md', label: 'Suave', radius: 'rounded-md' },
              { id: 'full', label: 'Redondo', radius: 'rounded-full' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => handleButtonRoundingChange(r.id as any)}
                className={cn(
                  "flex-1 py-2 text-xs font-bold border flex justify-center items-center gap-1",
                  (appearance.buttonStyle?.rounding || 'lg') === r.id
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                  r.radius
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Background (Placeholder) */}
      <section className="opacity-50 pointer-events-none">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-600 mb-3 flex items-center gap-2">
          Fundo Personalizado <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Em Breve</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2">
            <PaintBucket className="w-6 h-6 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Cor Sólida</span>
          </div>
          <div className="border border-slate-200 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-6 h-6 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Imagem</span>
          </div>
        </div>
      </section>
      
      {saving && <p className="text-xs text-blue-600 text-center animate-pulse">Salvando alterações...</p>}
    </div>
  );
}
