'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Loader2, X } from 'lucide-react';
import { reviewUploadsApi } from '@/lib/api';

const MAX_FILES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type UploadedPhoto = {
  id: number;
  previewUrl: string;
  name: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
};

export function ReviewPhotoUploader({
  onChange,
}: {
  onChange: (mediaIds: number[], uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const response = await reviewUploadsApi.createSession();
    setSessionId(response.id);
    return response.id;
  };

  const waitUntilReady = async (uploadSessionId: string, mediaId: number) => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const session = await reviewUploadsApi.getSession(uploadSessionId);
      const media = session.media.find((item) => item.id === mediaId);
      if (media?.status === 'ready') return true;
      if (media?.status === 'failed' || media?.status === 'rejected') return false;
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }
    return false;
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);
    const selected = Array.from(fileList);
    if (photos.length + selected.length > MAX_FILES) {
      setError('Você pode adicionar até 6 fotos.');
      return;
    }

    const invalid = selected.find((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalid) {
      setError('Use JPG, PNG ou WebP, com até 5 MB por foto.');
      return;
    }

    const uploadSessionId = await ensureSession();
    const placeholders = selected.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.push(previewUrl);
      return { id: -Date.now() - Math.random(), previewUrl, name: file.name, status: 'uploading' as const };
    });
    setPhotos((current) => [...current, ...placeholders]);
    onChange([], true);

    const uploadedIds: number[] = [];
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      const placeholder = placeholders[index];
      try {
        const response = await reviewUploadsApi.upload(uploadSessionId, file, photos.length + index);
        const mediaId = Number(response.id);
        uploadedIds.push(mediaId);
        setPhotos((current) => current.map((photo) => photo.id === placeholder.id ? { ...photo, id: mediaId, status: 'processing' } : photo));
        const ready = await waitUntilReady(uploadSessionId, mediaId);
        setPhotos((current) => current.map((photo) => photo.id === mediaId ? { ...photo, status: ready ? 'ready' : 'error' } : photo));
        if (!ready) {
          setError('Não foi possível processar uma foto. Tente novamente.');
          continue;
        }
      } catch {
        setPhotos((current) => current.map((photo) => photo.id === placeholder.id ? { ...photo, status: 'error' } : photo));
        setError('Não foi possível enviar uma foto. Tente novamente.');
      }
    }

    const session = await reviewUploadsApi.getSession(uploadSessionId);
    const allReadyIds = session.media.filter((media) => media.status === 'ready').map((media) => media.id);
    onChange(Array.from(new Set([...allReadyIds, ...uploadedIds])), false);
  };

  const remove = async (photo: UploadedPhoto) => {
    if (photo.id > 0 && sessionId) await reviewUploadsApi.remove(sessionId, photo.id);
    URL.revokeObjectURL(photo.previewUrl);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    onChange(photos.filter((item) => item.id !== photo.id && item.id > 0).map((item) => item.id), false);
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Fotos da sua experiência</p>
          <p className="text-xs text-slate-500">JPG, PNG ou WebP • até 5 MB • máximo 6 fotos</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50">
          <ImagePlus className="h-4 w-4" /> Adicionar fotos
        </button>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} multiple className="hidden" onChange={(event) => void handleFiles(event.target.files)} />
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src={photo.previewUrl} alt="Foto selecionada para avaliação" className="h-full w-full object-cover" />
              <button type="button" onClick={() => void remove(photo)} aria-label={`Remover foto ${photo.name}`} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                {photo.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                {photo.status === 'processing' && 'Processando'}
                {photo.status === 'ready' && <Check className="h-3 w-3 text-emerald-300" />}
                {photo.status === 'error' && 'Falhou'}
              </span>
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}