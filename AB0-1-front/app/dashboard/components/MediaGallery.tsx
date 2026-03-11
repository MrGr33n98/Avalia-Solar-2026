'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Upload, Video, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { companiesApi, fetchApi } from '@/lib/api';
import { useImageGalleryWatch } from '@/lib/analytics/hooks/useIntentTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useGalleryContext7 } from '@/app/context7/provider';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';

function hasMediaUploadFeature(planFeatures: any): boolean | null {
  if (!planFeatures) return null;
  if (typeof planFeatures === 'string') {
    try {
      return hasMediaUploadFeature(JSON.parse(planFeatures));
    } catch {
      return null;
    }
  }
  const candidates = [
    planFeatures.media_upload,
    planFeatures.media_gallery,
    planFeatures.allow_media_uploads,
    planFeatures.gallery_uploads,
    planFeatures.media,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (typeof candidate === 'string') {
      return candidate === 'true';
    }
    return !!candidate;
  }
  return null;
}

interface MediaGalleryProps {
  companyId: string;
  showControls?: boolean;
  showHeader?: boolean;
  planFeatures?: any;
}

export default function MediaGallery({ companyId, showControls = true, showHeader = true, planFeatures }: MediaGalleryProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { trackGalleryDwell } = useImageGalleryWatch(companyId);
  const { gallery, dispatchGallery } = useGalleryContext7();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [companyData, setCompanyData] = useState<any>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoViewRef = useRef<{ startedAt: number; photoIndex: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<{ type: 'photo' | 'video'; url: string; video_id?: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        dispatchGallery({ type: 'loading', loading: true });
        try {
          const company = await companiesApi.getById(Number(companyId));
          setCompanyData(company);
        } catch {}
        try {
          const photosResp = await fetchApi<{ photos: string[] }>('/company_dashboard/media');
          const photoItems = (photosResp?.photos || []).map((url, idx) => {
            const normalized = getFullImageUrl(url) || url;
            return { id: `${idx}`, url: normalized };
          });
          dispatchGallery({ type: 'set_photos', photos: photoItems });
        } catch {
          dispatchGallery({ type: 'set_photos', photos: [] });
        }
        try {
          const videosResp = await fetchApi<{ videos: any[] }>('/company_dashboard/videos');
          const videoItems = (videosResp?.videos || []).map((v) => ({
            id: String(v.id),
            url: v.url,
            thumbnail_url: getFullImageUrl(v.thumbnail_url) || v.thumbnail_url,
            provider: v.provider,
            video_id: v.video_id,
          }));
          dispatchGallery({ type: 'set_videos', videos: videoItems });
        } catch {
          dispatchGallery({ type: 'set_videos', videos: [] });
        }
      } finally {
        dispatchGallery({ type: 'loading', loading: false });
      }
    };
    load();
  }, [companyId]);

  const isSuperAdmin = user?.role === 'admin';
  const isCompanyMember = user?.role === 'company' && Number(user.company_id) === Number(companyId);
  const planFlag = useMemo(() => hasMediaUploadFeature(planFeatures), [planFeatures]);
  const companyFlag = useMemo(
    () =>
      hasMediaUploadFeature(companyData?.plan_features) ??
      (companyData?.media_upload_allowed ?? (companyData?.featured || companyData?.verified)),
    [companyData]
  );

  const canUpload = Boolean(isSuperAdmin || (isCompanyMember && (planFlag ?? companyFlag ?? false)));
  const controlsVisible = showControls && canUpload;

  const flushPhotoView = useCallback(() => {
    if (!photoViewRef.current) return;

    trackGalleryDwell(Date.now() - photoViewRef.current.startedAt, photoViewRef.current.photoIndex);
    photoViewRef.current = null;
  }, [trackGalleryDwell]);

  const openPhotoLightbox = useCallback(
    (url: string, photoIndex: number) => {
      flushPhotoView();
      photoViewRef.current = { startedAt: Date.now(), photoIndex };
      setLightboxItem({ type: 'photo', url });
      setLightboxOpen(true);
    },
    [flushPhotoView]
  );

  useEffect(() => {
    return () => {
      flushPhotoView();
    };
  }, [flushPhotoView]);

  const handleUpload = () => {
    if (!controlsVisible) return;
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxBytes = 8 * 1024 * 1024; // 8MB

    const invalid = Array.from(files).filter(
      (file) => !allowedTypes.includes(file.type) || file.size > maxBytes
    );

    if (invalid.length > 0) {
      const reasons = invalid.map((file) => {
        if (!allowedTypes.includes(file.type)) return `${file.name}: formato inválido`;
        return `${file.name}: excede ${Math.round(maxBytes / 1024 / 1024)}MB`;
      });
      toast({
        title: 'Upload bloqueado',
        description: reasons.join(' | '),
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('images[]', f));
      const resp = await fetchApi('/company_dashboard/upload_media', { method: 'POST', body: form });
      
      if ((resp as any)?.error) {
        toast({ 
          title: 'Erro no upload', 
          description: String((resp as any).error),
          variant: 'destructive'
        });
      } else {
        toast({ title: 'Sucesso', description: 'Upload enviado para aprovação' });
      }
    } catch (error: any) {
      console.error('[MediaGallery] Upload error:', error);
      toast({ 
        title: 'Erro no upload', 
        description: error.message || 'Ocorreu um erro ao tentar enviar as fotos.',
        variant: 'destructive'
      });
    }
  };

  const onAddVideo = async () => {
    if (!videoUrl || !controlsVisible) return;
    
    try {
      const resp = await fetchApi('/company_dashboard/add_video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: videoUrl }),
      });
      
      if ((resp as any)?.error) {
        toast({ 
          title: 'URL inválida', 
          description: String((resp as any).error),
          variant: 'destructive'
        });
        return;
      }
      
      toast({ title: 'Sucesso', description: 'Vídeo enviado para aprovação' });
      setShowVideoDialog(false);
      setVideoUrl('');
    } catch (error: any) {
      console.error('[MediaGallery] Add video error:', error);
      toast({ 
        title: 'Erro ao adicionar vídeo', 
        description: error.message || 'Ocorreu um erro ao tentar adicionar o vídeo.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Galeria de Mídia</h2>
            <p className="text-muted-foreground">Fotos e vídeos da empresa</p>
          </div>
          {controlsVisible && (
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
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'photos' | 'videos')}>
        <TabsList>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          {gallery.loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-square rounded-lg" />
              ))}
            </div>
          ) : gallery.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  className="rounded-lg overflow-hidden group"
                  onClick={() => openPhotoLightbox(photo.url, index)}
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <img src={photo.url} alt={photo.title} className="w-full aspect-square object-cover" />
                    </CardContent>
                  </Card>
                </button>
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
                {controlsVisible && (
                  <Button onClick={handleUpload} disabled={!canUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de Fotos
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="videos">
          {gallery.loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="w-full aspect-square rounded-lg" />
              ))}
            </div>
          ) : gallery.videos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.videos.map((v) => (
                <button
                  key={v.id}
                  className="rounded-lg overflow-hidden group"
                  onClick={() => {
                    flushPhotoView();
                    setLightboxItem({ type: 'video', url: v.url, video_id: v.video_id });
                    setLightboxOpen(true);
                  }}
                >
                  <Card className="overflow-hidden group">
                    <CardContent className="p-0">
                      <img src={v.thumbnail_url || ''} alt={v.video_id} className="w-full aspect-square object-cover" />
                    </CardContent>
                  </Card>
                </button>
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
                {controlsVisible && (
                  <Button variant="outline" onClick={() => setShowVideoDialog(true)} disabled={!canUpload}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Vídeo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showVideoDialog && controlsVisible} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Vídeo do YouTube</DialogTitle>
            <DialogDescription>
              Informe a URL do video para enviar o conteudo para aprovacao.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Cole a URL do YouTube aqui" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={onAddVideo} disabled={!videoUrl}>Enviar para Aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (!open) {
            flushPhotoView();
          }
          setLightboxOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualização</DialogTitle>
            <DialogDescription className="sr-only">
              Visualize a foto ou o video selecionado em tamanho ampliado.
            </DialogDescription>
          </DialogHeader>
          {lightboxItem?.type === 'photo' && (
            <img src={lightboxItem.url} alt="" className="w-full h-auto object-contain rounded-lg" />
          )}
          {lightboxItem?.type === 'video' && lightboxItem?.video_id && (
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${lightboxItem.video_id}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
