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
import { useAuth } from '@/contexts/AuthContext';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

type SponsorCarouselProps = {
  banners: Banner[];
  className?: string;
  height?: string;
  allowUpload?: boolean;
  onUploaded?: (url: string) => void;
};

type SlideItem = {
  id: number | string;
  title: string;
  link?: string;
  imageSrc: string;
  width: number | null;
  height: number | null;
  sponsored: boolean;
  _failed?: boolean;
};

const toSafeLength = (value: unknown, max = 50): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const normalized = Math.floor(parsed);
  if (normalized <= 0) return 0;
  return Math.min(normalized, max);
};

function resolveImageSrc(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // ✅ já é absoluta
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // ✅ ActiveStorage / caminhos locais (mesma origem)
  // Ex: /rails/active_storage/blobs/..., /uploads/..., /images/...
  if (trimmed.startsWith('/')) return trimmed;

  // ✅ se vier "images/..." sem barra
  if (trimmed.startsWith('images/')) return `/${trimmed}`;

  // ✅ caso contrário, trata como caminho que precisa ser resolvido pro host da API/CDN
  return getFullImageUrl(trimmed);
}

export default function SponsorCarousel({
  banners,
  className,
  // ✅ Altura aproximadamente dobrada para melhor presença visual
  height = 'h-[200px] sm:h-[240px] md:h-[280px]',
  allowUpload = true,
  onUploaded,
}: SponsorCarouselProps) {
  const slides: SlideItem[] = useMemo(() => {
    return (banners || [])
      .map((b, idx) => {
        // tenta em vários campos (caso API mude)
        const raw =
          (b as any).image_url ||
          (b as any).image ||
          (b as any).image?.url ||
          (b as any).photo_url ||
          (b as any).url ||
          null;

        return {
          id: b.id ?? `banner-${idx}`,
          title: b.title || 'Patrocínio',
          link: b.link || (b as any).link_url || undefined,
          imageSrc: resolveImageSrc(raw) || '',
          width: (b as any).width ?? null,
          height: (b as any).height ?? null,
          sponsored: (b as any).sponsored ?? false,
        };
      })
      .filter((s) => Boolean(s.imageSrc && typeof s.imageSrc === 'string'));
  }, [banners]);

  const [uploadedSlides, setUploadedSlides] = useState<SlideItem[]>([]);

  const displaySlides = useMemo(() => {
    return uploadedSlides.length > 0 ? [...uploadedSlides, ...slides] : slides;
  }, [uploadedSlides, slides]);

  const [errorIds, setErrorIds] = useState(new Set<number | string>());

  const handleImgError = (id: number | string) => {
    if (id === undefined || id === null) return;
    setErrorIds((prev) => new Set([...Array.from(prev), id]));
  };

  // ✅ Não removemos o slide totalmente — apenas trocamos por fallback visual
  const validSlides = useMemo(() => {
    return displaySlides.map((s) => ({
      ...s,
      _failed: errorIds.has(s.id),
    }));
  }, [displaySlides, errorIds]);

  const autoplay = useMemo(() => Autoplay({ delay: 5000, stopOnInteraction: false }), []);

  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const { user } = useAuth();
  const canUpload = Boolean(user?.role === 'admin' || user?.role === 'company');

  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifPreview, setGifPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

      if (uploadedUrl && onUploaded) onUploaded(uploadedUrl);

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
        try {
          api?.scrollTo(0);
        } catch {}
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
      setSnapCount(toSafeLength(api.scrollSnapList().length));
    };
    update();
    api.on('reInit', update);
    api.on('select', update);
    return () => {
      api.off('reInit', update);
      api.off('select', update);
    };
  }, [api]);

  const safeSnapCount = toSafeLength(snapCount);

  // ✅ fallback global quando não vem nada da API
  if (validSlides.length === 0) {
    const content = (
      <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mx-auto w-full">
        <CardContent className={cn('relative p-0 w-full bg-white', height)}>
          <Image
            src={'/images/banner-avalia-solar.png'}
            alt={'Banner'}
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
            className="object-cover object-center"
          />
        </CardContent>
      </Card>
    );
    return <div className={cn('w-full', className)}>{content}</div>;
  }

  if (validSlides.length === 1) {
    const s = validSlides[0];
    const content = (
      <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mx-auto w-full">
        <CardContent className={cn('relative p-0 w-full bg-white', height)}>
          {s._failed ? (
            <Image
              src={'/images/banner-avalia-solar.png'}
              alt={'Banner fallback'}
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
              className="object-cover object-center"
            />
          ) : (
            <Image
              src={s.imageSrc}
              alt={s.title}
              fill
              priority
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
            <Label htmlFor="gif-upload" className="text-sm font-medium">
              Upload de GIF (até 5MB)
            </Label>
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
        plugins={[autoplay]} 
        opts={{ loop: true }} 
        className="w-full group relative"
        aria-roledescription="carrossel"
      >
        <CarouselContent className="-ml-4">
          {validSlides.map((s, index) => (
            <CarouselItem 
              key={s.id} 
              className="pl-4"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${validSlides.length}`}
            >
              <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mx-auto w-full">
                <CardContent
                  className={cn('relative p-0 w-full bg-slate-50 dark:bg-slate-900', height)}
                >
                  {s.link ? (
                    <Link href={s.link} target="_blank" rel="noopener noreferrer" className="block w-full h-full" title={s.title}>
                      {s._failed ? (
                        <Image
                          src={'/images/banner-avalia-solar.png'}
                          alt={'Banner de fallback AvaliaSolar'}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <Image
                          src={s.imageSrc}
                          alt={s.title}
                          fill
                          priority={index === 0}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                          className="object-cover object-center"
                          onError={() => handleImgError(s.id)}
                        />
                      )}
                    </Link>
                  ) : s._failed ? (
                    <Image
                      src={'/images/banner-avalia-solar.png'}
                      alt={'Banner de fallback AvaliaSolar'}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                      className="object-cover object-center"
                    />
                  ) : (
                    <Image
                      src={s.imageSrc}
                      alt={s.title}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1180px"
                      className="object-cover object-center"
                      onError={() => handleImgError(s.id)}
                    />
                  )}

                  {s.sponsored && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                      Patrocinado
                    </span>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          className="left-3 md:left-4 h-8 w-8 bg-white/95 hover:bg-white border border-gray-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="Banner anterior"
        />
        <CarouselNext
          className="right-3 md:right-4 h-8 w-8 bg-white/95 hover:bg-white border border-gray-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="Próximo banner"
        />

        {safeSnapCount > 1 ? (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {Array.from({ length: safeSnapCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => api?.scrollTo(idx)}
                className="relative flex h-8 w-8 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                aria-label={`Ir para o banner ${idx + 1}`}
                aria-current={idx === selectedIndex}
              >
                <span
                  className={cn(
                    'block h-[7px] rounded-full transition-all duration-200',
                    idx === selectedIndex ? 'w-[18px] bg-blue-600' : 'w-[7px] bg-slate-300 hover:bg-slate-400'
                  )}
                />
              </button>
            ))}
          </div>
        ) : null}
      </Carousel>
    </div>
  );
}
