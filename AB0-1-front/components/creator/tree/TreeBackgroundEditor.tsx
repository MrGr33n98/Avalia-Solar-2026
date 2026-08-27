import React, { useRef, useState } from 'react';
import { PaintBucket, Image as ImageIcon, CircleSlash, Upload } from 'lucide-react';
import { CreatorTreeAppearance } from '@/types/creator-tree';
import { cn } from '@/lib/utils';
import { reviewerTreeSettingsApi } from '@/lib/api/creatorTree';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';

interface TreeBackgroundEditorProps {
  appearance: CreatorTreeAppearance;
  onChange: (background: CreatorTreeAppearance['background']) => void;
}

export function TreeBackgroundEditor({ appearance, onChange }: TreeBackgroundEditorProps) {
  const bg = appearance.background;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleTypeChange = (type: 'color' | 'image' | 'gradient' | undefined) => {
    if (!type) {
      onChange(undefined);
      return;
    }
    onChange({ 
      type, 
      value: type === 'color' ? '#ffffff' : type === 'gradient' ? 'linear-gradient(to right, #ff7e5f, #feb47b)' : '',
      fit: 'cover',
      position: 'center center',
      overlayOpacity: 0
    });
  };

  const handleValueChange = (updates: Partial<NonNullable<CreatorTreeAppearance['background']>>) => {
    if (!bg) return;
    onChange({ ...bg, ...updates });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Formato de arquivo inválido. Por favor, envie uma imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    const previousValue = bg?.value;
    const localUrl = URL.createObjectURL(file);
    handleValueChange({ type: 'image', value: localUrl });
    try {
      setUploading(true);
      const res = await reviewerTreeSettingsApi.uploadBackgroundImage(file);
      handleValueChange({ type: 'image', value: res.url });
      URL.revokeObjectURL(localUrl);
      toast.success('Imagem carregada com sucesso!');
    } catch {
      URL.revokeObjectURL(localUrl);
      handleValueChange({ type: 'image', value: previousValue || '' });
      toast.error('Não foi possível carregar a imagem.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-600 flex items-center gap-2">
        Fundo Personalizado
      </h3>
      
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => handleTypeChange(undefined)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-colors",
            !bg ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <CircleSlash className="w-4 h-4 mb-1" />
          Padrão
        </button>
        <button
          onClick={() => handleTypeChange('color')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-colors",
            bg?.type === 'color' ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <PaintBucket className="w-4 h-4 mb-1" />
          Cor
        </button>
        <button
          onClick={() => handleTypeChange('gradient')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-colors",
            bg?.type === 'gradient' ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <div className="w-4 h-4 mb-1 rounded bg-gradient-to-br from-indigo-500 to-purple-500" />
          Degradê
        </button>
        <button
          onClick={() => handleTypeChange('image')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[10px] font-bold transition-colors",
            bg?.type === 'image' ? "bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          )}
        >
          <ImageIcon className="w-4 h-4 mb-1" />
          Imagem
        </button>
      </div>

      {bg?.type === 'color' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-bold text-slate-700">
            Cor Hexadecimal
            <div className="flex gap-2 mt-1">
              <input 
                type="color" 
                value={bg.value} 
                onChange={(e) => handleValueChange({ value: e.target.value })}
                className="h-11 w-11 rounded-xl border border-slate-200 p-1 cursor-pointer"
              />
              <input 
                type="text" 
                value={bg.value} 
                onChange={(e) => handleValueChange({ value: e.target.value })}
                placeholder="#FFFFFF"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </label>
        </div>
      )}

      {bg?.type === 'gradient' && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-bold text-slate-700">
            CSS Linear Gradient
            <input 
              type="text" 
              value={bg.value} 
              onChange={(e) => handleValueChange({ value: e.target.value })}
              placeholder="linear-gradient(to right, #ff7e5f, #feb47b)"
              className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-mono placeholder:font-sans focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>
      )}

      {bg?.type === 'image' && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Upload de Imagem
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-blue-400 transition-all font-semibold text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Enviando...' : 'Escolher Imagem (Max 5MB)'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => void handleFileUpload(e)}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>
          </label>
          {bg.value && (
            <div className="flex gap-2">
              <div className="w-16 h-16 rounded-lg bg-slate-200 border border-slate-200 overflow-hidden flex-shrink-0">
                <img src={bg.value} alt="Background Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Ajuste (Fit)</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleValueChange({ fit: 'cover' })}
                      className={cn("px-3 py-1 rounded border text-[11px] font-bold", (bg.fit || 'cover') === 'cover' ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white text-slate-600 hover:bg-slate-50")}
                    >
                      Preencher
                    </button>
                    <button 
                      onClick={() => handleValueChange({ fit: 'contain' })}
                      className={cn("px-3 py-1 rounded border text-[11px] font-bold", bg.fit === 'contain' ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white text-slate-600 hover:bg-slate-50")}
                    >
                      Conter
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Posição Focal</p>
                  <select 
                    value={bg.position || 'center center'}
                    onChange={(e) => handleValueChange({ position: e.target.value })}
                    className="w-full border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="top center">Cima</option>
                    <option value="center center">Centro</option>
                    <option value="bottom center">Baixo</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {bg && (
        <div className="mt-6 space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Película (Overlay)</label>
              <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{bg.overlayOpacity || 0}%</span>
            </div>
            <Slider 
              value={[bg.overlayOpacity || 0]}
              max={100}
              step={5}
              onValueChange={([val]) => handleValueChange({ overlayOpacity: val })}
              className="py-2"
            />
          </div>

          {(bg.overlayOpacity || 0) > 0 && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Cor da Película</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={bg.overlayColor || '#000000'} 
                  onChange={(e) => handleValueChange({ overlayColor: e.target.value })}
                  className="h-8 w-8 rounded border border-slate-200 p-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  value={bg.overlayColor || '#000000'} 
                  onChange={(e) => handleValueChange({ overlayColor: e.target.value })}
                  className="h-8 flex-1 rounded border border-slate-200 px-2 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Desfoque (Blur)</label>
              <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{bg.blur || 0}px</span>
            </div>
            <Slider 
              value={[bg.blur || 0]}
              max={20}
              step={1}
              onValueChange={([val]) => handleValueChange({ blur: val })}
              className="py-2"
            />
          </div>
        </div>
      )}
    </section>
  );
}
