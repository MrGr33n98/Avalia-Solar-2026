'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { uploadEmailAsset } from '@/lib/api/sales/emailAssets';
import type { EmailAsset } from '../../types';

interface EmailAssetUploaderProps {
  onAssetUploaded: (asset: EmailAsset) => void;
  kind?: string;
}

export function EmailAssetUploader({ onAssetUploaded, kind = 'other' }: EmailAssetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formato não suportado. Apenas JPEG, PNG e WebP são aceitos.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. O limite máximo é de 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    setUploading(true);
    try {
      const asset = await uploadEmailAsset(formData);
      onAssetUploaded(asset);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha no upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/50'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
        } ${uploading ? 'opacity-70 cursor-wait' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
            <p className="text-xs font-bold text-slate-700">Otimizando e enviando imagem...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div className="p-2.5 rounded-full bg-white shadow-2xs text-blue-900 border border-slate-200">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPEG ou WebP (máx. 5 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default EmailAssetUploader;

