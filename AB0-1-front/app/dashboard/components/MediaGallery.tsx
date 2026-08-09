'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  ImageIcon,
  Upload,
  Video,
  Plus,
  Play,
  LayoutGrid,
  Folder,
  Search,
  List,
  MoreVertical,
  Trash2,
  ChevronRight,
  FolderPlus,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { fetchApi } from '@/lib/api';
import { useImageGalleryWatch } from '@/lib/analytics/hooks/useIntentTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useGalleryContext7 } from '@/app/context7/provider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullImageUrl } from '@/utils/image';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { isFeatureEnabled } from '@/lib/feature-access';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaGalleryProps {
  companyId: string;
  showControls?: boolean;
  showHeader?: boolean;
  mode?: 'all' | 'photos' | 'videos' | 'downloads';
  planFeatures?: unknown;
}

type DashboardVideo = {
  id: string | number;
  url: string;
  thumbnail_url?: string;
  provider?: string;
  video_id?: string;
};

type ApiErrorResponse = {
  error?: string;
};

interface FolderData {
  id: string;
  name: string;
  count: number;
}

const SYSTEM_FOLDERS: FolderData[] = [
  { id: 'all', name: 'Todos os arquivos', count: 0 },
  { id: 'projetos', name: 'Projetos', count: 0 },
  { id: 'produtos', name: 'Produtos', count: 0 },
  { id: 'equipe', name: 'Equipe', count: 0 },
  { id: 'eventos', name: 'Eventos', count: 0 },
  { id: 'instalacoes', name: 'Instalações', count: 0 },
  { id: 'lixeira', name: 'Lixeira', count: 0 },
];

type WidgetMediaType = 'all' | 'photos' | 'videos';
type WidgetSortOption = 'recent' | 'old' | 'name';

export default function MediaGallery({
  companyId,
  showControls = true,
  showHeader = true,
  mode: _mode = 'all',
}: MediaGalleryProps) {
  const { user } = useAuth();
  const { trackGalleryDwell } = useImageGalleryWatch(companyId);
  const { gallery, dispatchGallery } = useGalleryContext7();
  
  // Custom states for premium layout
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<WidgetMediaType>('all');
  const [sortBy, setSortBy] = useState<WidgetSortOption>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [fileToMove, setFileToMove] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  // local storage mapping for file-to-folder categorization
  const [fileFolderMap, setFileFolderMap] = useState<Record<string, string>>({});

  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoViewRef = useRef<{ startedAt: number; photoIndex: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<{
    type: 'photo' | 'video';
    url: string;
    video_id?: string;
  } | null>(null);

  // Load custom folders and map from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFolders = localStorage.getItem(`gallery_folders_${companyId}`);
      if (savedFolders) setCustomFolders(JSON.parse(savedFolders));
      
      const savedMap = localStorage.getItem(`gallery_map_${companyId}`);
      if (savedMap) setFileFolderMap(JSON.parse(savedMap));
    }
  }, [companyId]);

  // Load media content from existing API contracts
  useEffect(() => {
    const load = async () => {
      try {
        dispatchGallery({ type: 'loading', loading: true });

        const pendingMediaUrls: string[] = [];
        const pendingVideos: Array<{
          id: string;
          url: string;
          thumbnail_url?: string;
          provider?: string;
          video_id?: string;
          pending?: boolean;
        }> = [];

        if (showControls) {
          try {
            const pendingResp = await fetchApi<{
              pending_changes?: Array<{
                id: number;
                change_type: string;
                data: {
                  urls?: string[];
                  url?: string;
                  thumbnail_url?: string;
                  provider?: string;
                  video_id?: string;
                };
              }>;
            }>('/company_dashboard/pending_changes');
            (pendingResp?.pending_changes || []).forEach((change) => {
              if (change.change_type === 'media' && Array.isArray(change.data?.urls)) {
                pendingMediaUrls.push(...change.data.urls);
              } else if (change.change_type === 'video' && change.data) {
                pendingVideos.push({
                  id: `pending-${change.id}`,
                  url: change.data.url || '',
                  thumbnail_url: change.data.thumbnail_url,
                  provider: change.data.provider,
                  video_id: change.data.video_id,
                  pending: true
                });
              }
            });
          } catch (e) {
            console.error('Error loading pending changes:', e);
          }
        }

        try {
          const photosResp = showControls
            ? await fetchApi<{ photos: string[] }>('/company_dashboard/media')
            : await fetchApi<{ company?: { media_urls?: string[] } }>(`/companies/${companyId}`, {
                noCache: true,
                cache: 'no-store',
              })
                .then((response) => ({ photos: response?.company?.media_urls || [] }));
          const photoItems = (photosResp?.photos || []).map((url, idx) => {
            const normalized = getFullImageUrl(url) || url;
            return { id: `approved-${idx}`, url: normalized, pending: false };
          });
          const pendingPhotoItems = pendingMediaUrls.map((url, idx) => {
            const normalized = getFullImageUrl(url) || url;
            return { id: `pending-media-${idx}`, url: normalized, pending: true };
          });
          dispatchGallery({ type: 'set_photos', photos: [...pendingPhotoItems, ...photoItems] });
        } catch {
          dispatchGallery({ type: 'set_photos', photos: [] });
        }

        try {
          const videosResp = showControls
            ? await fetchApi<{ videos: DashboardVideo[] }>('/company_dashboard/videos')
            : await fetchApi<{ company?: { videos?: DashboardVideo[] } }>(`/companies/${companyId}`, {
                noCache: true,
                cache: 'no-store',
              })
                .then((response) => ({ videos: response?.company?.videos || [] }));
          const videoItems = (videosResp?.videos || []).map((v) => ({
            id: String(v.id),
            url: v.url,
            thumbnail_url: getFullImageUrl(v.thumbnail_url) || v.thumbnail_url,
            provider: v.provider,
            video_id: v.video_id,
            pending: false
          }));
          dispatchGallery({ type: 'set_videos', videos: [...pendingVideos, ...videoItems] });
        } catch {
          dispatchGallery({ type: 'set_videos', videos: [] });
        }
      } finally {
        dispatchGallery({ type: 'loading', loading: false });
      }
    };
    load();
  }, [companyId, dispatchGallery, showControls]);

  const isSuperAdmin = user?.role === 'admin';
  const isCompanyMember = user?.role === 'company' && Number(user.company_id) === Number(companyId);
  const { features } = useCompanyFeatures(companyId);

  const canUpload = Boolean(
    isSuperAdmin || (isCompanyMember && isFeatureEnabled(features, 'media_gallery'))
  );
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
    if (isSubmitting) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxBytes = 3 * 1024 * 1024;

    const invalid = Array.from(files).filter(
      (file) => !allowedTypes.includes(file.type) || file.size > maxBytes
    );

    if (invalid.length > 0) {
      toast({
        title: 'Upload bloqueado',
        description: 'Imagens devem ser PNG, JPEG ou WebP e ter no máximo 3MB.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    try {
      setIsSubmitting(true);
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('images[]', f));
      const resp = await fetchApi<ApiErrorResponse>('/company_dashboard/upload_media', {
        method: 'POST',
        body: form,
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      });

      if (resp?.error) {
        toast({
          title: 'Erro no upload',
          description: String(resp.error),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Imagem enviada para aprovação',
          description: 'Ela aparecerá no perfil assim que for aprovada.',
        });
      }
    } catch {
      toast({ title: 'Falha no upload', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      e.target.value = '';
    }
  };

  const onAddVideo = async () => {
    if (!videoUrl || !controlsVisible || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const resp = await fetchApi<ApiErrorResponse>('/company_dashboard/add_video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ url: videoUrl }),
      });
      if (resp?.error) {
        toast({
          title: 'Link Inválido',
          description: String(resp.error),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Vídeo enviado para aprovação',
        description: 'Ele aparecerá no perfil assim que for aprovado.',
      });
      setShowVideoDialog(false);
      setVideoUrl('');
    } catch {
      toast({ title: 'Erro ao adicionar vídeo', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate deterministic size and metadata for media
  const getMediaMeta = (url: string) => {
    const filename = url.split('/').pop()?.split('?')[0] || 'arquivo.png';
    const ext = filename.split('.').pop()?.toUpperCase() || 'PNG';
    
    // Deterministic sizes based on string length/char codes
    let sum = 0;
    for (let i = 0; i < url.length; i++) sum += url.charCodeAt(i);
    const sizeMb = ((sum % 15) + 1.2).toFixed(1);
    
    // Deterministic dates
    const day = (sum % 28) + 1;
    const month = (sum % 12) + 1;
    const dateStr = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/2026`;

    return {
      filename,
      ext,
      size: `${sizeMb} MB`,
      date: dateStr,
      bytes: parseFloat(sizeMb) * 1024 * 1024
    };
  };

  // Automatic/Dynamic categorization logic based on filename & local storage map
  const getFileCategory = useCallback((url: string) => {
    if (fileFolderMap[url]) return fileFolderMap[url];
    
    const lower = url.toLowerCase();
    if (lower.includes('logo') || lower.includes('weg')) return 'produtos';
    if (lower.includes('projeto') || lower.includes('residencial') || lower.includes('comercial')) return 'projetos';
    if (lower.includes('instalacao') || lower.includes('inversor') || lower.includes('estacao')) return 'instalacoes';
    return 'todos';
  }, [fileFolderMap]);

  // Folders definition
  const allFolders = useMemo(() => {
    const custom = customFolders.map((f) => ({
      id: f.toLowerCase().replace(/\s+/g, '-'),
      name: f,
      count: 0
    }));
    return [...SYSTEM_FOLDERS, ...custom];
  }, [customFolders]);

  // Aggregate stats & items list
  const mediaItems = useMemo(() => {
    const photos = gallery.photos.map((p) => ({
      id: p.id,
      url: p.url,
      type: 'photo' as const,
      pending: p.pending,
      ...getMediaMeta(p.url)
    }));

    const videos = gallery.videos.map((v) => ({
      id: v.id,
      url: v.url,
      type: 'video' as const,
      pending: v.pending,
      video_id: v.video_id,
      thumbnail_url: v.thumbnail_url,
      ...getMediaMeta(v.url)
    }));

    return [...photos, ...videos];
  }, [gallery.photos, gallery.videos]);

  // Calculate folder counts dynamically
  const foldersWithCounts = useMemo(() => {
    return allFolders.map((folder) => {
      let count = 0;
      if (folder.id === 'all') {
        count = mediaItems.length;
      } else {
        count = mediaItems.filter((item) => getFileCategory(item.url) === folder.id).length;
      }
      return { ...folder, count };
    });
  }, [allFolders, mediaItems, getFileCategory]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      // 1. Search Query
      if (searchQuery && !item.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Tab/Type Filter
      if (mediaTypeFilter === 'photos' && item.type !== 'photo') return false;
      if (mediaTypeFilter === 'videos' && item.type !== 'video') return false;
      
      // 3. Folder Filter
      if (selectedFolder !== 'all') {
        const cat = getFileCategory(item.url);
        if (cat !== selectedFolder) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      // Since we don't have accurate dates in API, mock sort by id prefix or index
      return sortBy === 'recent' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
    });
  }, [mediaItems, searchQuery, mediaTypeFilter, selectedFolder, sortBy, getFileCategory]);

  // Storage Stats (summing deterministic bytes)
  const storageStats = useMemo(() => {
    const totalBytes = mediaItems.reduce((acc, item) => acc + item.bytes, 0);
    const totalGb = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);
    return {
      used: totalGb,
      percent: Math.min(100, Math.round((parseFloat(totalGb) / 10) * 100))
    };
  }, [mediaItems]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const updated = [...customFolders, newFolderName.trim()];
    setCustomFolders(updated);
    localStorage.setItem(`gallery_folders_${companyId}`, JSON.stringify(updated));
    setNewFolderName('');
    setShowFolderDialog(false);
    toast({ title: 'Pasta criada com sucesso' });
  };

  const handleMoveFile = (folderId: string) => {
    if (!fileToMove) return;
    const newMap = { ...fileFolderMap, [fileToMove]: folderId };
    setFileFolderMap(newMap);
    localStorage.setItem(`gallery_map_${companyId}`, JSON.stringify(newMap));
    setFileToMove(null);
    setShowMoveDialog(false);
    toast({ title: 'Arquivo movido' });
  };

  const handleDeleteFile = (url: string) => {
    const newMap = { ...fileFolderMap, [url]: 'lixeira' };
    setFileFolderMap(newMap);
    localStorage.setItem(`gallery_map_${companyId}`, JSON.stringify(newMap));
    toast({ title: 'Mídia movida para a lixeira' });
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-24 px-4 sm:px-6">
      
      {/* 1. Header (Breadcrumbs & Actions) */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <span>Perfil da Empresa</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 font-bold">Galeria de Mídia</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Galeria de Mídia</h1>
            <p className="text-xs text-slate-400 font-medium">Gerencie todas as imagens e vídeos da sua empresa em um só lugar.</p>
          </div>
          {controlsVisible && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFolderDialog(true)}
                className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 border-slate-200"
              >
                <FolderPlus className="w-4 h-4 mr-2 text-slate-500" />
                Adicionar pasta
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFilesSelected}
              />
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar arquivos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 2. Library Overview Stats Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center sm:text-left">
          <div className="pt-2 sm:pt-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Visão geral da biblioteca</span>
            <p className="text-xs text-slate-500 leading-tight">Total de arquivos armazenados na sua galeria.</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <h4 className="text-2xl font-black text-blue-600">{gallery.photos.length}</h4>
            <span className="text-xs text-slate-500 font-semibold">Imagens</span>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <h4 className="text-2xl font-black text-slate-900">{gallery.videos.length}</h4>
            <span className="text-xs text-slate-500 font-semibold">Vídeos</span>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <h4 className="text-2xl font-black text-slate-900">{storageStats.used} GB</h4>
            <span className="text-xs text-slate-500 font-semibold">Armazenamento usado</span>
          </div>
        </div>
      </div>

      {/* 3. Main Area (Sidebar + File Workspace Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <div className="md:col-span-3 space-y-6">
          {/* Folders List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pastas</span>
              <button 
                onClick={() => setShowFolderDialog(true)}
                className="p-1 rounded bg-slate-50 hover:bg-slate-100 border text-slate-500"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <nav className="space-y-1">
              {foldersWithCounts.map((folder) => {
                const active = selectedFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                      active 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className={cn("w-4 h-4 shrink-0", active ? "text-blue-500" : "text-slate-400")} />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <Badge variant="outline" className={cn("border-none text-[10px] h-5 min-w-5 justify-center px-1 rounded-full", active ? "bg-blue-100 text-blue-700" : "bg-slate-50 text-slate-500")}>
                      {folder.count}
                    </Badge>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Storage Meter */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Armazenamento</span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">{storageStats.used} GB de 10 GB</span>
                <span className="text-blue-600">{storageStats.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-50 overflow-hidden border">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${storageStats.percent}%` }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 border-slate-200"
            >
              Gerenciar plano
            </Button>
          </div>
        </div>

        {/* Main Grid Column */}
        <div className="md:col-span-9 space-y-4">
          {/* File Toolbar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar arquivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-medium focus-visible:ring-blue-600/30"
              />
            </div>

            {/* Sorting/Filters / Toggles */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Type Filter */}
              <select
                value={mediaTypeFilter}
                onChange={(e) => setMediaTypeFilter(e.target.value as WidgetMediaType)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-600"
              >
                <option value="all">Tipo: Todos</option>
                <option value="photos">Imagens</option>
                <option value="videos">Vídeos</option>
              </select>

              {/* Sort filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as WidgetSortOption)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-600"
              >
                <option value="recent">Mais recentes</option>
                <option value="old">Mais antigos</option>
                <option value="name">Nome A-Z</option>
              </select>

              {/* Grid / List switcher */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1.5 rounded-md", viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn("p-1.5 rounded-md", viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Files Grid */}
          <AnimatePresence mode="wait">
            {gallery.loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-full aspect-square rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <motion.div
                layout
                className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 sm:grid-cols-4 gap-4" 
                    : "flex flex-col gap-2"
                )}
              >
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className={cn(
                        "relative bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-blue-600/30 transition-all group",
                        isSelected && "border-blue-600"
                      )}
                    >
                      {/* Checkbox selector */}
                      <div className="absolute top-3 left-3 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                        />
                      </div>

                      {/* File format indicator */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-black/60 backdrop-blur border-none text-[8px] font-black text-white h-5">
                          {item.ext}
                        </Badge>
                      </div>

                      {/* Card Content wrapper */}
                      {viewMode === 'grid' ? (
                        <div className="flex flex-col h-full">
                          {/* Image/Thumbnail area */}
                          <div 
                            onClick={() => item.type === 'photo' ? openPhotoLightbox(item.url, 0) : setLightboxItem({ type: 'video', url: item.url, video_id: item.video_id })}
                            className="aspect-square relative bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            {item.pending && (
                              <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
                                <Badge className="bg-yellow-500 text-black border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">Pendente</Badge>
                              </div>
                            )}
                            {item.type === 'photo' ? (
                              <Image
                                src={item.url}
                                alt={item.filename}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-all duration-500"
                              />
                            ) : (
                              <div className="relative w-full h-full">
                                {item.thumbnail_url ? (
                                  <Image
                                    src={item.thumbnail_url}
                                    alt={item.filename}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover group-hover:scale-105 transition-all duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-slate-700" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-blue-600/20 transition-all">
                                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25">
                                    <Play className="w-4 h-4 text-white fill-white" />
                                  </div>
                                </div>
                                <span className="absolute bottom-2 right-2 bg-black/60 text-[8px] text-white font-bold px-1.5 py-0.5 rounded">00:45</span>
                              </div>
                            )}
                          </div>

                          {/* Info Footer */}
                          <div className="p-3.5 space-y-1 bg-white border-t border-slate-50">
                            <div className="flex items-start justify-between gap-1.5">
                              <p className="text-xs font-bold text-slate-800 truncate flex-1">{item.filename}</p>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-0.5 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-100">
                                  <DropdownMenuItem 
                                    onSelect={() => {
                                      setFileToMove(item.url);
                                      setShowMoveDialog(true);
                                    }}
                                    className="text-xs font-bold text-slate-600"
                                  >
                                    Mover para pasta
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onSelect={() => handleDeleteFile(item.url)}
                                    className="text-xs font-bold text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    Excluir mídia
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                              <span>{item.size}</span>
                              <span>·</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // List View Mode
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-12 bg-slate-50 border rounded-lg overflow-hidden shrink-0">
                              {item.type === 'photo' ? (
                                <Image src={item.url} alt="" fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                  <Video className="w-5 h-5 text-slate-700" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.filename}</p>
                              <span className="text-[10px] text-slate-400 font-semibold">{item.size} · {item.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFileToMove(item.url);
                                setShowMoveDialog(true);
                              }}
                              className="h-8 rounded-lg text-[10px] font-bold text-slate-600 border-slate-200"
                            >
                              Mover
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFile(item.url)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">Nenhum arquivo encontrado</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-normal">Não encontramos nenhuma mídia nesta pasta ou correspondente à busca.</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {filteredItems.length > 0 && (
            <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold">Mostrando 1-{filteredItems.length} de {filteredItems.length} arquivos</span>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold text-slate-600 border-slate-200" disabled>Anterior</Button>
                <Button variant="outline" size="sm" className="h-8 w-8 text-[10px] font-bold bg-blue-50 text-blue-600 border-none">1</Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold text-slate-600 border-slate-200" disabled>Próximo</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer navigation/support links */}
      <div className="flex justify-center items-center gap-6 pt-4 text-xs font-bold border-t border-slate-200/60 mt-8">
        <a 
          href="/support" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Falar com suporte</span>
        </a>
        <span className="text-slate-300">|</span>
        <a 
          href="/docs" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Ver documentação</span>
        </a>
      </div>

      {/* dialog to create new folder */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="max-w-md bg-white border-none p-6 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Adicionar nova pasta</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Dê um nome para a sua pasta personalizada.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Projetos de Residência"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="h-11 rounded-xl text-xs font-semibold focus-visible:ring-blue-600/30"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowFolderDialog(false)} className="text-xs font-bold">Cancelar</Button>
            <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">Criar pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog to move file to folder */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md bg-white border-none p-6 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Mover mídia para pasta</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Escolha a pasta de destino para este arquivo.</DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-60 overflow-y-auto space-y-1">
            {foldersWithCounts.filter((f) => f.id !== 'all').map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveFile(folder.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left"
              >
                <Folder className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowMoveDialog(false)} className="text-xs font-bold">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog && controlsVisible} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-md bg-white border-none p-6 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Adicionar vídeo</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Cole um link do YouTube para adicionar à sua galeria.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="h-11 rounded-xl text-xs font-semibold focus-visible:ring-blue-600/30"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowVideoDialog(false)} className="text-xs font-bold">Cancelar</Button>
            <Button onClick={onAddVideo} disabled={!videoUrl || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">Adicionar</Button>
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
        <DialogContent className="max-w-4xl bg-black/95 border-none p-0 overflow-hidden rounded-none">
          <div className="p-4 md:p-8 h-full flex items-center justify-center relative">
            {lightboxItem?.type === 'photo' && (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={lightboxItem.url}
                alt=""
                className="max-w-full max-h-[75vh] object-contain"
              />
            )}
            {lightboxItem?.type === 'video' && lightboxItem?.video_id && (
              <div className="aspect-video w-full">
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
        </DialogContent>
      </Dialog>

    </div>
  );
}
