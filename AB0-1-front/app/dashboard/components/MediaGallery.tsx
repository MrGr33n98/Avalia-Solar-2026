'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Plus, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { companiesApi, fetchApi } from '@/lib/api';

interface MediaGalleryProps {
  companyId: string;
}

export default function MediaGallery({ companyId }: MediaGalleryProps) {
  const [photos, setPhotos] = useState<{ id: string; url: string; title?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [canUpload, setCanUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const company = await companiesApi.getById(Number(companyId));
        setCanUpload(!!(company?.featured || company?.verified));
        const data = await fetchApi<{ photos: string[] }>('/company_dashboard/media');
        const items = (data?.photos || []).map((url, idx) => ({ id: `${idx}`, url }));
        setPhotos(items);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const handleUpload = () => {
    if (!canUpload) return;
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('images[]', f));
    await fetchApi('/company_dashboard/upload_media', { method: 'POST', body: form });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Galeria de Mídia</h2>
          <p className="text-muted-foreground">Gerencie fotos e mídia da empresa</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
        <Button onClick={handleUpload} disabled={!canUpload}>
          <Upload className="h-4 w-4 mr-2" />
          Upload de Fotos
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">Carregando...</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group">
              <CardContent className="p-0 relative">
                <img 
                  src={photo.url} 
                  alt={photo.title}
                  className="w-full aspect-square object-cover"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma foto adicionada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione fotos para mostrar seus projetos e instalações.
            </p>
            <Button onClick={handleUpload} disabled={!canUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload de Fotos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
