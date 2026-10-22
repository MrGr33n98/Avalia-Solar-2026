"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, ImageIcon, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Company, fetchApi } from "@/lib/api";
import { canShowMediaGallery } from "@/lib/feature-access";

interface ProjectsPreviewProps {
  company: Company;
  onTabChange: (tabId: string) => void;
}

export interface ShowcaseMediaItem {
  id: string | number;
  type: "video" | "image";
  title: string;
  thumbnail: string;
  videoUrl?: string | null;
  provider?: string | null;
}

type ProjectAsset = {
  id: number;
  kind: "image" | "video" | "document";
  title?: string | null;
  file_url?: string | null;
  external_url?: string | null;
};

type ProjectItem = {
  id: number;
  title: string;
  assets?: ProjectAsset[];
};

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") return parsed.pathname.slice(1);
    if (host === "youtube.com") {
      return (
        parsed.searchParams.get("v") ||
        parsed.pathname.split("/").filter(Boolean).pop() ||
        null
      );
    }
  } catch {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  }
  return null;
}

function toVideoEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1` : null;
    }
    if (host === "youtube.com") {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function ProjectsPreview({ company, onTabChange }: ProjectsPreviewProps) {
  const hasAccess = canShowMediaGallery(company);
  const [projectAssets, setProjectAssets] = useState<ShowcaseMediaItem[]>([]);
  const [activeVideo, setActiveVideo] = useState<ShowcaseMediaItem | null>(null);
  const [activeImage, setActiveImage] = useState<ShowcaseMediaItem | null>(null);

  // Busca projetos adicionais apenas se a empresa tiver direito no plano
  useEffect(() => {
    let active = true;
    if (!hasAccess || !company.id) return;

    fetchApi<{ projects: ProjectItem[] }>(`/companies/${company.id}/projects`)
      .then((res) => {
        if (!active) return;
        const extracted: ShowcaseMediaItem[] = [];
        (res.projects || []).forEach((p) => {
          (p.assets || []).forEach((asset) => {
            const assetUrl = asset.file_url || asset.external_url;
            if (assetUrl) {
              extracted.push({
                id: `asset-${asset.id}`,
                type: asset.kind === "video" ? "video" : "image",
                title: asset.title || p.title || `Projeto - ${company.name}`,
                thumbnail: assetUrl,
                videoUrl: asset.kind === "video" ? assetUrl : null,
              });
            }
          });
        });
        setProjectAssets(extracted);
      })
      .catch(() => {
        if (active) setProjectAssets([]);
      });

    return () => {
      active = false;
    };
  }, [hasAccess, company.id, company.name]);

  // Monta lista de mídias reais da empresa
  const displayedMedia = useMemo(() => {
    if (!hasAccess) return [];
    const items: ShowcaseMediaItem[] = [];

    // 1. Vídeos oficiais da empresa
    if (Array.isArray(company.videos)) {
      company.videos.forEach((v, idx) => {
        if (typeof v === "string") {
          const ytId = extractYoutubeId(v);
          const thumb = ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : "/images/banner-landing-page-avalia-solar.jpg";
          items.push({
            id: `video-str-${idx}`,
            type: "video",
            title: `Vídeo Institucional - ${company.name}`,
            thumbnail: thumb,
            videoUrl: v,
          });
        } else if (v && typeof v === "object") {
          const videoObj = v as {
            id?: number | string;
            url?: string;
            thumbnail_url?: string | null;
            title?: string | null;
            video_id?: string | null;
          };
          const ytId = videoObj.video_id || extractYoutubeId(videoObj.url || "");
          const thumb =
            videoObj.thumbnail_url ||
            (ytId
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
              : "/images/banner-landing-page-avalia-solar.jpg");
          items.push({
            id: videoObj.id ? `video-obj-${videoObj.id}` : `video-obj-${idx}`,
            type: "video",
            title: videoObj.title || `Vídeo da ${company.name}`,
            thumbnail: thumb,
            videoUrl: videoObj.url || null,
          });
        }
      });
    }

    // 2. Vídeo do canal YouTube da empresa (se for link de vídeo válido e ainda não estiver na lista)
    if (company.youtube_url) {
      const ytId = extractYoutubeId(company.youtube_url);
      if (ytId && !items.some((i) => i.videoUrl && i.videoUrl.includes(ytId))) {
        items.push({
          id: "company-youtube-main",
          type: "video",
          title: `Vídeo Institucional - ${company.name}`,
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          videoUrl: company.youtube_url,
        });
      }
    }

    // 3. Fotos da galeria da empresa
    if (Array.isArray(company.media_urls)) {
      company.media_urls.forEach((url, idx) => {
        if (url && typeof url === "string" && url.trim().length > 0) {
          items.push({
            id: `media-url-${idx}`,
            type: "image",
            title: `Galeria da ${company.name}`,
            thumbnail: url,
          });
        }
      });
    }

    // 4. Ativos reais extraídos de projetos da empresa
    projectAssets.forEach((asset) => {
      items.push(asset);
    });

    // Retorna EXCLUSIVAMENTE o que a empresa realmente listou (máximo de 4 mídias)
    return items.slice(0, 4);
  }, [
    hasAccess,
    company.videos,
    company.media_urls,
    company.name,
    company.youtube_url,
    projectAssets,
  ]);

  const handleMediaClick = (item: ShowcaseMediaItem) => {
    if (item.type === "video") {
      setActiveVideo(item);
    } else {
      setActiveImage(item);
    }
  };

  // Se a empresa for do plano Free (ou sem direito à galeria de mídia), não renderiza o componente
  if (!hasAccess) {
    return null;
  }

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
      {/* 1. Header Principal: Portfólio & Projetos + CTA Ver vitrine completa */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
          Portfólio & Projetos
        </h3>

        <button
          type="button"
          onClick={() => onTabChange("projects")}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          <span>Ver vitrine completa</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </button>
      </div>

      {/* 2. Subcabeçalho da Galeria de Mídia */}
      <div className="mb-4">
        <h4 className="text-sm font-bold text-slate-900">Galeria de mídia</h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Imagens e vídeos publicados pela empresa.
        </p>
      </div>

      {/* 3. Grid Responsivo de Mídias Reais: até 4 colunas no Desktop / 2x2 no Mobile (PWA) */}
      {displayedMedia.length > 0 ? (
        <div
          className={`grid gap-3 sm:gap-4 ${
            displayedMedia.length === 1
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-sm sm:max-w-none"
              : "grid-cols-2 md:grid-cols-4"
          }`}
        >
          {displayedMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMediaClick(item)}
              className="group relative aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleMediaClick(item);
              }
            }}
            aria-label={`${item.type === "video" ? "Assistir vídeo" : "Ver imagem"}: ${item.title}`}
          >
            {/* Thumbnail da Mídia */}
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />

            {/* Badge superior esquerdo translúcido */}
            <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-semibold tracking-wide shadow-sm pointer-events-none">
              {item.type === "video" ? (
                <>
                  <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white text-white" aria-hidden="true" />
                  Video
                </>
              ) : (
                <>
                  <ImageIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" aria-hidden="true" />
                  Imagem
                </>
              )}
            </span>

            {/* Botão de Play centralizado para Vídeos */}
            {item.type === "video" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 shadow-lg text-slate-900 transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5 fill-slate-900 text-slate-900" aria-hidden="true" />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      /* Estado quando a empresa não publicou fotos ou vídeos */
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2.5">
          <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="text-xs font-medium text-slate-600">
            Galeria sob consulta: esta empresa ainda não publicou mídias públicas.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("contact")}
          className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Solicitar portfólio
        </button>
      </div>
    )}

      {/* Modal / Dialog de Reprodução de Vídeo */}
      <Dialog open={Boolean(activeVideo)} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-2xl bg-black border-none text-white">
          <DialogHeader className="p-4 pb-2 bg-slate-950 flex flex-row items-center justify-between border-b border-slate-800">
            <DialogTitle className="text-sm sm:text-base font-bold text-white truncate pr-6">
              {activeVideo?.title || `Vídeo da ${company.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Reprodução de vídeo da empresa {company.name}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full bg-black">
            {activeVideo?.videoUrl && toVideoEmbedUrl(activeVideo.videoUrl) ? (
              <iframe
                src={toVideoEmbedUrl(activeVideo.videoUrl)!}
                title={activeVideo.title || "Vídeo"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                <Play className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Não foi possível reproduzir este vídeo diretamente.</p>
                {activeVideo?.videoUrl && (
                  <a
                    href={activeVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs text-blue-400 underline hover:text-blue-300"
                  >
                    Abrir vídeo em nova aba
                  </a>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal / Dialog de Visualização de Imagem */}
      <Dialog open={Boolean(activeImage)} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-2xl bg-black border-none text-white">
          <DialogHeader className="p-4 pb-2 bg-slate-950 flex flex-row items-center justify-between border-b border-slate-800">
            <DialogTitle className="text-sm sm:text-base font-bold text-white truncate pr-6">
              {activeImage?.title || `Imagem da ${company.name}`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualização da imagem da empresa {company.name}
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[16/10] sm:aspect-video w-full bg-black">
            {activeImage?.thumbnail && (
              <Image
                src={activeImage.thumbnail}
                alt={activeImage.title}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
