'use client';

import React, { useState } from 'react';
import type { TemplateBlock, EmailAsset } from '../../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Library,
  Link as LinkIcon,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
} from 'lucide-react';
import { EmailAssetUploader } from './EmailAssetUploader';
import { EmailAssetLibraryDialog } from '../../library/EmailAssetLibraryDialog';

interface BlockProps {
  block: TemplateBlock;
  onChange: (props: Partial<TemplateBlock['props']>) => void;
}

export function ImageBlock({ block, onChange }: BlockProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'url'>('upload');

  const url = block.props.url || block.props.src || '';
  const alt = block.props.alt || '';
  const assetId = block.props.asset_id;
  const width = block.props.width || 560;
  const align = block.props.align || 'center';
  const linkUrl = block.props.link_url || '';

  const hasImage = Boolean(url || assetId);

  const handleAssetSelected = (asset: EmailAsset) => {
    onChange({
      asset_id: asset.id,
      url: asset.public_url || '',
      src: asset.public_url || '',
      alt: alt || asset.alt_text || asset.name,
      width: asset.width_px ? Math.min(asset.width_px, 560) : 560,
    });
  };

  const handleClearImage = () => {
    onChange({
      asset_id: null,
      url: '',
      src: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Has Image -> Show Preview & Controls */}
      {hasImage ? (
        <div className="space-y-4">
          {/* Preview Card */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-28 w-36 shrink-0 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
              <img
                src={url}
                alt={alt || 'Prévia da imagem'}
                className="w-full h-full object-contain p-1"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2 w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {alt || (assetId ? `Asset #${assetId}` : 'Imagem vinculada')}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearImage}
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Remover
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLibraryOpen(true)}
                  className="h-7 text-xs font-semibold"
                >
                  <Library className="w-3 h-3 mr-1 text-slate-500" /> Trocar pela Biblioteca
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('upload')}
                  className="h-7 text-xs font-semibold"
                >
                  <Upload className="w-3 h-3 mr-1 text-slate-500" /> Novo Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Texto Alternativo (Alt)</label>
              <Input
                value={alt}
                onChange={(e) => onChange({ alt: e.target.value })}
                placeholder="Ex: Foto do módulo solar fotovoltaico"
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Link de Destino (Opcional)</label>
              <div className="relative">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <Input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => onChange({ link_url: e.target.value })}
                  placeholder="https://suaempresa.com.br"
                  className="text-xs h-8 pl-8"
                />
              </div>
            </div>

            {/* Largura & Alinhamento */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Largura Máxima</label>
                <span className="text-[11px] text-slate-500 font-mono">{width}px</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[200, 320, 480, 560].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onChange({ width: w })}
                    className={`flex-1 py-1 rounded border text-xs font-semibold transition-colors ${
                      width === w
                        ? 'border-blue-800 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {w === 560 ? '100%' : `${w}px`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Alinhamento</label>
              <div className="flex items-center gap-1">
                {[
                  { key: 'left', icon: AlignLeft, label: 'Esquerda' },
                  { key: 'center', icon: AlignCenter, label: 'Centro' },
                  { key: 'right', icon: AlignRight, label: 'Direita' },
                ].map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ align: key as 'left' | 'center' | 'right' })}
                    title={label}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded border text-xs transition-colors ${
                      align === key
                        ? 'border-blue-800 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Image -> Source Selection Tabs */
        <div className="space-y-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-max">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('library');
                setLibraryOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'library'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Library className="w-3.5 h-3.5" /> Biblioteca
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'url'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" /> URL Externa
            </button>
          </div>

          {activeTab === 'upload' && (
            <EmailAssetUploader onAssetUploaded={handleAssetSelected} />
          )}

          {activeTab === 'library' && (
            <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">Selecione uma imagem já cadastrada</p>
              <Button
                type="button"
                size="sm"
                onClick={() => setLibraryOpen(true)}
                className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs"
              >
                Abrir Biblioteca de Imagens
              </Button>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/40">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">URL Pública da Imagem</label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => onChange({ url: e.target.value, src: e.target.value })}
                  placeholder="https://exemplo.com/imagem.png"
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Texto Alternativo (Alt)</label>
                <Input
                  value={alt}
                  onChange={(e) => onChange({ alt: e.target.value })}
                  placeholder="Descrição da imagem"
                  className="text-xs h-8"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Library Dialog Modal */}
      <EmailAssetLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleAssetSelected}
      />
    </div>
  );
}

export default ImageBlock;
