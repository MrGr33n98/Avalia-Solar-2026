'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Upload, Video, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { companiesApi, fetchApi } from '@/lib/api';
import { useGalleryContext7 } from '@/app/context7/provider';

interface MediaGalleryProps {
  companyId: string;
}

export default function MediaGallery({ companyId }: MediaGalleryProps) {
  const { toast } = useToast();
  const { gallery, dispatchGallery } = useGalleryContext7();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [canUpload, setCanUpload] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        dispatchGallery({ type: 'loading', loading: true });
        const company = await companiesApi.getById(Number(companyId));
        setCanUpload(!!(company?.featured || company?.verified));
        const photosResp = await fetchApi<{ photos: string[] }>('/company_dashboard/media');
        const videosResp = await fetchApi<{ videos: any[] }>('/company_dashboard/videos');
        const photoItems = (photosResp?.photos || []).map((url, idx) => ({ id: `${idx}`, url }));
        const videoItems = (videosResp?.videos || []).map((v) => ({ id: String(v.id), url: v.url, thumbnail_url: v.thumbnail_url, provider: v.provider, video_id: v.video_id }));
        dispatchGallery({ type: 'set_photos', photos: photoItems });
        dispatchGallery({ type: 'set_videos', videos: videoItems });
      } finally {
        dispatchGallery({ type: 'loading', loading: false });
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
    const resp = await fetchApi('/company_dashboard/upload_media', { method: 'POST', body: form });
    if ((resp as any)?.error) {
      toast({ title: 'Erro no upload', description: String((resp as any).error) });
    } else {
      toast({ title: 'Upload enviado para aprovação' });
    }
  };

  const onAddVideo = async () => {
    if (!videoUrl) return;
    const resp = await fetchApi('/company_dashboard/add_video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl }),
    });
    if ((resp as any)?.error) {
      toast({ title: 'URL inválida', description: String((resp as any).error) });
      return;
    }
    toast({ title: 'Vídeo enviado para aprovação' });
    setShowVideoDialog(false);
    setVideoUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Galeria de Mídia</h2>
          <p className="text-muted-foreground">Gerencie fotos e vídeos da empresa</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
          <Button onClick={handleUpload} disabled={!canUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload de Fotos
          </Button>
          <Button variant="outline" onClick={() => setShowVideoDialog(true)} disabled={!canUpload}>
            <Video className="h-4 w-4 mr-2" />
            Adicionar Vídeo
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'photos' | 'videos')}>
        <TabsList>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          {gallery.loading ? (
            <Card><CardContent className="p-6">Carregando fotos...</CardContent></Card>
          ) : gallery.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <img src={photo.url} alt={photo.title} className="w-full aspect-square object-cover" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
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
        </TabsContent>

        <TabsContent value="videos">
          {gallery.loading ? (
            <Card><CardContent className="p-6">Carregando vídeos...</CardContent></Card>
          ) : gallery.videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.videos.map((v) => (
                <Card key={v.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <img src={v.thumbnail_url || ''} alt={v.video_id} className="w-full aspect-square object-cover" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum vídeo adicionado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Adicione vídeos do YouTube com suas instalações e projetos.
                </p>
                <Button variant="outline" onClick={() => setShowVideoDialog(true)} disabled={!canUpload}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Vídeo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo do YouTube</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Cole a URL do YouTube aqui" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={onAddVideo} disabled={!videoUrl}>Enviar para Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
