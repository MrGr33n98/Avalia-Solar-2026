'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { 
  ImageIcon, 
  Upload, 
  Video, 
  Plus, 
  Play, 
  Maximize2,
  Eye, 
  Camera, 
  FileVideo, 
  ExternalLink,
  ShieldCheck,
  Zap,
  LayoutGrid,
  MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { companiesApi, fetchApi } from '@/lib/api';
import { useImageGalleryWatch } from '@/lib/analytics/hooks/useIntentTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useGalleryContext7 } from '@/app/context7/provider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

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
  }, [companyId, dispatchGallery]);

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
    const maxBytes = 8 * 1024 * 1024; 

    const invalid = Array.from(files).filter(
      (file) => !allowedTypes.includes(file.type) || file.size > maxBytes
    );

    if (invalid.length > 0) {
      toast({
        title: 'Upload bloquado',
        description: "Verifique o formato ou o tamanho dos arquivos.",
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
        toast({ title: 'Erro no Upload', description: String((resp as any).error), variant: 'destructive' });
      } else {
        toast({ title: 'Protocolo de Upload Iniciado', description: 'Ativos enviados para análise de integridade.' });
      }
    } catch (error: any) {
      toast({ title: 'Falha Total no Upload', variant: 'destructive' });
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
        toast({ title: 'Link Inválido', description: String((resp as any).error), variant: 'destructive' });
        return;
      }
      toast({ title: 'Stream Sincronizado', description: 'O vídeo foi indexado e enviado para aprovação.' });
      setShowVideoDialog(false);
      setVideoUrl('');
    } catch (error: any) {
      toast({ title: 'Erro Crítico de Sincronização', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-24">
      {/* Visual Assets Header */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-6 w-6 text-brand-blue" />
              <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground dark:text-white">
                Visual Assets Vault
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
              Repositório institucional de alta performance para ativos visuais, demonstrações técnicas e provas sociais em vídeo.
            </p>
          </div>
          {controlsVisible && (
            <div className="flex gap-4 p-2 bg-slate-100 dark:bg-white/[0.03] rounded-[2rem] border border-slate-200 dark:border-white/5">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
              <Button 
                onClick={handleUpload} 
                disabled={!canUpload}
                className="clay-precision bg-brand-blue hover:bg-blue-700 text-white h-12 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowVideoDialog(true)} 
                disabled={!canUpload}
                className="h-12 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Index Video
              </Button>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'photos' | 'videos')} className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <TabsList className="bg-transparent h-auto p-0 gap-8">
            <TabsTrigger 
              value="photos" 
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none p-0 text-sm font-black uppercase tracking-[0.2em] relative transition-all group opacity-40 data-[state=active]:opacity-100"
            >
              <div className="flex items-center gap-3 py-2">
                <LayoutGrid className="h-4 w-4" />
                High-Res Photos
              </div>
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full"
                initial={false}
                animate={{ scaleX: activeTab === 'photos' ? 1 : 0 }}
              />
            </TabsTrigger>
            <TabsTrigger 
              value="videos" 
              className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none p-0 text-sm font-black uppercase tracking-[0.2em] relative transition-all group opacity-40 data-[state=active]:opacity-100"
            >
              <div className="flex items-center gap-3 py-2">
                <MonitorPlay className="h-4 w-4" />
                Video Streams
              </div>
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-brand-blue rounded-full"
                initial={false}
                animate={{ scaleX: activeTab === 'videos' ? 1 : 0 }}
              />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="photos" className="m-0 focus-visible:outline-none">
          <AnimatePresence mode="wait">
            {gallery.loading ? (
              <motion.div 
                key="loading-photos"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-square rounded-[2rem] bg-slate-100 dark:bg-white/5" />
                ))}
              </motion.div>
            ) : gallery.photos.length > 0 ? (
              <motion.div 
                key="photos-grid"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              >
                {gallery.photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      className="w-full rounded-[2rem] overflow-hidden group relative aspect-square clay-precision bg-card dark:bg-[#0F172A] border-none"
                      onClick={() => openPhotoLightbox(photo.url, index)}
                    >
                      <Image 
                        src={photo.url} 
                        alt={photo.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                      />
                      <div className="absolute inset-0 bg-brand-blue/0 group-hover:bg-brand-blue/20 transition-all duration-500 flex items-center justify-center">
                         <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-500 border border-white/20">
                            <Maximize2 className="h-5 w-5 text-white" />
                         </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-photos"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/5"
              >
                <div className="h-24 w-24 rounded-[2rem] bg-brand-blue/10 flex items-center justify-center mb-8">
                  <ImageIcon className="h-10 w-10 text-brand-blue" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-2">Vault Empty</h3>
                <p className="text-sm text-muted-foreground font-medium mb-8">Nenhuma prova visual detectada no diretório atual.</p>
                {controlsVisible && (
                  <Button onClick={handleUpload} className="h-12 rounded-2xl bg-brand-blue px-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-blue/10">
                    Deploy First Asset
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="videos" className="m-0 focus-visible:outline-none">
          <AnimatePresence mode="wait">
            {gallery.loading ? (
              <motion.div 
                key="loading-videos"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-video rounded-[2rem] bg-slate-100 dark:bg-white/5" />
                ))}
              </motion.div>
            ) : gallery.videos.length > 0 ? (
              <motion.div
                key="videos-grid"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {gallery.videos.map((v, idx) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <button
                      className="w-full group relative aspect-video clay-precision rounded-[2.5rem] bg-card dark:bg-[#0F172A] border-none overflow-hidden"
                      onClick={() => {
                        flushPhotoView();
                        setLightboxItem({ type: 'video', url: v.url, video_id: v.video_id });
                        setLightboxOpen(true);
                      }}
                    >
                      <Image 
                        src={v.thumbnail_url || ''} 
                        alt={v.video_id} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100" 
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 group-hover:bg-brand-blue/20 transition-all duration-500">
                         <div className="h-20 w-20 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-blue transition-all duration-500 shadow-2xl">
                            <Play className="h-8 w-8 text-white fill-white" />
                         </div>
                      </div>
                      <div className="absolute top-6 right-6 h-10 w-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <FileVideo className="h-4 w-4 text-white/60" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-videos"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/5"
              >
                <div className="h-24 w-24 rounded-[2rem] bg-brand-blue/10 flex items-center justify-center mb-8">
                  <Video className="h-10 w-10 text-brand-blue" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest mb-2">Streams Offline</h3>
                <p className="text-sm text-muted-foreground font-medium mb-8">Nenhum pipeline de vídeo configurado para este perfil.</p>
                {controlsVisible && (
                  <Button onClick={() => setShowVideoDialog(true)} className="h-12 rounded-2xl bg-brand-blue px-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-blue/10">
                    Sync Video Stream
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog && controlsVisible} onOpenChange={setShowVideoDialog}>
        <DialogContent className="clay-precision bg-card dark:bg-[#0F172A] border-none rounded-[2.5rem] p-12 max-w-md animate-in zoom-in-95 duration-300">
          <DialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-[1.5rem] bg-brand-blue/10 flex items-center justify-center mb-8">
               <Video className="h-10 w-10 text-brand-blue" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter mb-2">Video Indexing</DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Sincronize ativos do YouTube para o pipeline de visualização da Avalia Solar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6">
            <div className="relative group">
               <ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
               <Input 
                placeholder="https://youtube.com/watch?v=..." 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)} 
                className="h-14 pl-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-xs font-bold focus-visible:ring-brand-blue/30"
               />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-4 mt-8">
            <Button 
              onClick={onAddVideo} 
              disabled={!videoUrl}
              className="h-14 w-full rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-brand-blue/20 transition-all active:scale-95"
            >
              Initialize Sync
            </Button>
            <Button variant="ghost" onClick={() => setShowVideoDialog(false)} className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Abort Protocol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onOpenChange={(open) => {
          if (!open) flushPhotoView();
          setLightboxOpen(open);
        }}
      >
        <DialogContent className="max-w-5xl bg-black/95 border-none p-0 overflow-hidden rounded-[3rem] shadow-[0_0_100px_rgba(37,99,235,0.2)]">
          <DialogHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-brand-blue" />
               </div>
               <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Visual Inspection Mode</DialogTitle>
            </div>
            <Badge variant="outline" className="h-8 rounded-xl bg-white/5 border-white/10 text-white/60 font-black text-[9px] tracking-widest uppercase px-4">
              {lightboxItem?.type === 'photo' ? 'Standard 2D Asset' : 'Video Stream x64'}
            </Badge>
          </DialogHeader>
          
          <div className="p-4 md:p-12 h-full flex items-center justify-center">
            {lightboxItem?.type === 'photo' && (
              <motion.img 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={lightboxItem.url} 
                alt="" 
                className="max-w-full max-h-[70vh] object-contain rounded-[2rem] shadow-2xl" 
              />
            )}
            {lightboxItem?.type === 'video' && lightboxItem?.video_id && (
              <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${lightboxItem.video_id}?autoplay=1&mute=0`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            )}
          </div>
          
          <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <ShieldCheck className="h-5 w-5 text-brand-green" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Verified Integrity Asset</p>
             </div>
             <Button variant="ghost" onClick={() => setLightboxOpen(false)} className="rounded-xl text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest">
                Exit Inspection
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
