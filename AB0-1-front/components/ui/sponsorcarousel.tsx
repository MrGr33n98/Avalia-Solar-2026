'use client';

import { useMemo, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Banner, fetchApi } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

type SponsorCarouselProps = {
  banners: Banner[];
  className?: string;
  height?: string;
  allowUpload?: boolean;
  onUploaded?: (url: string) => void;
};

function resolveImageSrc(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/images/')) return trimmed;
  return getFullImageUrl(trimmed);
}

export default function SponsorCarousel({
  banners,
  className,
  height = 'h-48 sm:h-56 md:h-64',
  allowUpload = true,
  onUploaded,
}: SponsorCarouselProps) {
  const slides = useMemo(() => {
    return (banners || [])
      .map((b) => ({
        id: b.id,
        title: b.title || 'Patrocínio',
        link: b.link || b.link_url || undefined,
        imageSrc: resolveImageSrc(b.image_url) || '',
        width: b.width ?? null,
        height: b.height ?? null,
        sponsored: b.sponsored ?? false,
      }))
      .filter((s) => Boolean(s.imageSrc));
  }, [banners]);

  const [uploadedSlides, setUploadedSlides] = useState<{id: number | string; title: string; imageSrc: string; width: number | null; height: number | null; sponsored: boolean}[]>([]);
  const displaySlides = useMemo(() => {
    return uploadedSlides.length > 0 ? [...uploadedSlides, ...slides] : slides;
  }, [uploadedSlides, slides]);

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [errorIds, setErrorIds] = useState(new Set<number | string>());
  const handleImgError = (id: number | string) => {
    setErrorIds((prev) => new Set([...Array.from(prev), id]));
  };

  const [canUpload, setCanUpload] = useState(false);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifPreview, setGifPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
      const auth = raw ? JSON.parse(raw) : null;
      const role = auth?.user?.role;
      setCanUpload(Boolean(role === 'admin' || role === 'company'));
    } catch {
      setCanUpload(false);
    }
  }, []);

  const handleSelectGif = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0] || null;
    if (!file) {
      setGifFile(null);
      setGifPreview(null);
      return;
    }
    if (file.type !== 'image/gif') {
      setUploadError('Formato inválido. Aceito apenas GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo acima de 5MB.');
      return;
    }
    setGifFile(file);
    const url = URL.createObjectURL(file);
    setGifPreview(url);
  };

  const handleUploadGif = async () => {
    if (!gifFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('images[]', gifFile);
      form.append('kind', 'banner_gif');
      const resp = await fetchApi<any>('/company_dashboard/upload_media', {
        method: 'POST',
        body: form,
      });
      const uploadedUrl =
        (resp && (resp.url || resp.image_url)) ||
        (Array.isArray(resp?.photos) ? resp.photos[resp.photos.length - 1] : null);
      if (uploadedUrl && onUploaded) {
        onUploaded(uploadedUrl);
      }
      if (uploadedUrl) {
        setUploadedSlides((prev) => [
          {
            id: `uploaded-${Date.now()}`,
            title: 'Banner enviado',
            imageSrc: resolveImageSrc(uploadedUrl) || uploadedUrl,
            width: null,
            height: null,
            sponsored: true,
          },
          ...prev,
        ]);
        try { api?.scrollTo(0); } catch {}
        setSelectedIndex(0);
      }
      setUploading(false);
      setGifFile(null);
      setGifPreview(null);
    } catch (err: any) {
      setUploading(false);
      setUploadError(err?.message || 'Falha ao enviar GIF.');
    }
  };

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setSelectedIndex(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };
    update();
    api.on('reInit', update);
    api.on('select', update);
    return () => {
      api.off('reInit', update);
      api.off('select', update);
    };
  }, [api]);

  if (displaySlides.length === 0) return null;

  if (displaySlides.length === 1) {
    const s = displaySlides[0];
    const content = (
      <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mx-auto w-full">
        <CardContent className={cn('relative p-0 w-full bg-white', height)}>
          <Image
            src={errorIds.has(s.id) ? '/images/banner-avalia-solar.png' : s.imageSrc}
            alt={s.title}
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
            className="object-cover object-center"
            onError={() => handleImgError(s.id)}
          />
          {s.sponsored && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Patrocinado
            </span>
          )}
        </CardContent>
      </Card>
    );
    return s.link ? (
      <Link href={s.link} target="_blank" rel="noopener noreferrer" className={cn('block w-full', className)}>
        {content}
      </Link>
    ) : (
      <div className={cn('w-full', className)}>{content}</div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {(allowUpload && canUpload) && (
        <div className="mb-3">
          <div className="flex items-center gap-3">
            <Label htmlFor="gif-upload" className="text-sm font-medium">Upload de GIF (até 5MB)</Label>
            <Input id="gif-upload" type="file" accept="image/gif" onChange={handleSelectGif} className="max-w-xs" />
            <Button type="button" size="sm" onClick={handleUploadGif} disabled={!gifFile || uploading}>
              {uploading ? 'Enviando...' : 'Enviar GIF'}
            </Button>
          </div>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          {gifPreview && (
            <div className={cn('mt-2 overflow-hidden rounded-2xl border border-gray-200 shadow-sm', height)}>
              <img src={gifPreview} alt="Pré-visualização GIF" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}
      <Carousel
        setApi={setApi}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        opts={{ loop: true }}
        className="w-full group"
      >
        <CarouselContent className="-ml-0">
        {displaySlides.map((s, index) => (
          <CarouselItem key={s.id} className="pl-0">
            <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mx-auto w-full">
              <CardContent
                className={cn('relative p-0 w-full bg-white', height)}
                style={
                  typeof s.width === 'number' && s.width > 0 && typeof s.height === 'number' && s.height > 0
                    ? { aspectRatio: `${s.width} / ${s.height}` }
                    : undefined
                }
              >
                {s.link ? (
                  <Link href={s.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <Image
                      src={errorIds.has(s.id) ? '/images/banner-avalia-solar.png' : s.imageSrc}
                      alt={s.title}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                      className="object-cover object-center"
                      onError={() => handleImgError(s.id)}
                    />
                  </Link>
                ) : (
                  <Image
                    src={errorIds.has(s.id) ? '/images/banner-avalia-solar.png' : s.imageSrc}
                    alt={s.title}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                    className="object-cover object-center"
                    onError={() => handleImgError(s.id)}
                  />
                )}
                {s.sponsored && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Patrocinado
                  </span>
                )}
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious
        className="left-3 md:left-4 bg-white/90 hover:bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Banner anterior"
      />
      <CarouselNext
        className="right-3 md:right-4 bg-white/90 hover:bg-white border border-gray-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Próximo banner"
      />

      {snapCount > 1 ? (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {Array.from({ length: snapCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === selectedIndex ? 'w-8 bg-blue-600' : 'w-2 bg-blue-200/70 hover:bg-blue-300'
              )}
              aria-label={`Ir para o banner ${idx + 1}`}
              aria-current={idx === selectedIndex}
            />
          ))}
        </div>
      ) : null}
    </Carousel>
    </div>
  );
}