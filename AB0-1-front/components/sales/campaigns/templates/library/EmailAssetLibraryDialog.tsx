'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { getEmailAssets, deleteEmailAsset, uploadEmailAsset } from '@/lib/api/sales/emailAssets';
import type { EmailAsset } from '../types';

interface EmailAssetLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: EmailAsset) => void;
}

const KIND_TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'logo', label: 'Logos' },
  { key: 'banner', label: 'Banners' },
  { key: 'photo', label: 'Fotos' },
  { key: 'product', label: 'Produtos' },
  { key: 'other', label: 'Outros' },
] as const;

export function EmailAssetLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: EmailAssetLibraryDialogProps) {
  const [assets, setAssets] = useState<EmailAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmailAssets({
        q: search || undefined,
        kind: selectedKind !== 'all' ? selectedKind : undefined,
        page,
        per_page: 12,
      });
      setAssets(data.assets || []);
      setTotalPages(data.meta?.total_pages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar imagens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAssets();
    }
  }, [open, search, selectedKind, page]);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo excede o limite máximo de 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', selectedKind !== 'all' ? selectedKind : 'other');

    setUploading(true);
    try {
      const newAsset = await uploadEmailAsset(formData);
      setAssets((prev) => [newAsset, ...prev]);
      onSelect(newAsset);
      onOpenChange(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Falha no upload da imagem.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (asset: EmailAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja arquivar a imagem "${asset.name}"?`)) return;

    setDeletingId(asset.id);
    try {
      await deleteEmailAsset(asset.id);
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir a imagem.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden z-[10060]">
        <DialogHeader className="p-5 border-b border-slate-200 bg-slate-50/50 pr-12">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Biblioteca de Imagens de E-mail
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Selecione ou envie imagens otimizadas para templates e campanhas de marketing.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleQuickUpload}
              />
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs gap-1.5 h-8"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Upload Imagem</span>
              </Button>
            </div>
          </div>

          {/* Search + Category Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <Input
                placeholder="Buscar por nome ou alt..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 text-xs h-8 bg-white border-slate-200"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-0.5 bg-slate-200/60 rounded-lg">
              {KIND_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedKind(tab.key);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedKind === tab.key
                      ? 'bg-white text-blue-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[340px]">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-xs font-bold text-slate-800">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchAssets} className="mt-2 text-xs">
                Tentar novamente
              </Button>
            </div>
          ) : assets.length === 0 ? (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center py-16 gap-3 text-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/70 transition-colors"
            >
              <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Nenhuma imagem encontrada</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clique aqui ou selecione um arquivo para fazer upload
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-1 text-xs gap-1.5 bg-white shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Selecionar imagem do computador</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isDeleting = deletingId === asset.id;
                const formattedKb = `${Math.round(asset.byte_size / 1024)} KB`;
                const dim = asset.width_px && asset.height_px ? `${asset.width_px}×${asset.height_px}` : '';

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      onSelect(asset);
                      onOpenChange(false);
                    }}
                    className="group relative flex flex-col rounded-xl border border-slate-200 bg-white hover:border-blue-600 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-28 w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {asset.public_url ? (
                        <img
                          src={asset.public_url}
                          alt={asset.alt_text || asset.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}

                      <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          Selecionar
                        </span>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 flex flex-col gap-1">
                      <p className="text-xs font-bold text-slate-800 truncate" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>{dim || asset.kind}</span>
                        <span>{formattedKb}</span>
                      </div>

                      {/* In-Use Badge & Delete */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                        {asset.in_use_by_campaigns ? (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Em Campanha
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">
                            {asset.kind}
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={isDeleting || asset.in_use_by_campaigns}
                          onClick={(e) => handleDelete(asset, e)}
                          title={
                            asset.in_use_by_campaigns
                              ? 'Imagem em uso por campanha. Não pode ser excluída.'
                              : 'Arquivar imagem'
                          }
                          className={`p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ${
                            asset.in_use_by_campaigns ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50/50 text-xs">
            <span className="text-slate-500 font-medium">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs px-2.5"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 text-xs px-2.5"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmailAssetLibraryDialog;

