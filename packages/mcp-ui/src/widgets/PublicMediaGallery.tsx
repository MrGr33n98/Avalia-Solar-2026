import { useState } from 'react';
import { z } from 'zod';
import { sanitizeExternalHttpsUrl } from '../bridge/capabilities';
import { LinkButton } from '../design/primitives';

export function GalleryImages({ images }: { images: string[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const safe = images.map(sanitizeExternalHttpsUrl).filter((url): url is string => Boolean(url))
    .filter((url) => !failed.includes(url));
  return (
    <div className="as-stack">
      {selected && safe.includes(selected) ? (
        <div className="as-stack">
          <img src={selected} alt="Foto ampliada" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }}
            onError={() => setFailed((urls) => [...urls, selected])} />
          <button className="as-btn" onClick={() => setSelected(null)}>Fechar foto</button>
        </div>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(80px, 100%), 1fr))', gap: 6 }}>
        {safe.map((url, index) => (
          <button key={url} className="as-btn" style={{ padding: 0, overflow: 'hidden', aspectRatio: '1' }}
            aria-label={`Ampliar foto ${index + 1}`} onClick={() => setSelected(url)}>
            <img src={url} alt={`Foto ${index + 1}`} loading="lazy"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setFailed((urls) => [...urls, url])} />
          </button>
        ))}
      </div>
      {!safe.length ? <span className="as-meta">Sem fotos disponíveis.</span> : null}
    </div>
  );
}

const GallerySchema = z.object({
  state: z.enum(['ready', 'error']),
  images: z.array(z.string()).max(6),
  videos: z.array(z.object({
    id: z.number().int().positive(),
    url: z.string(),
    thumbnail_url: z.string().nullable(),
  })).max(3),
});
const Envelope = z.object({ data: z.object({ integrator: z.object({ gallery_preview: GallerySchema }) }) });

export function readGalleryPreview(raw: unknown) {
  const parsed = Envelope.safeParse(raw);
  return parsed.success ? parsed.data.data.integrator.gallery_preview : undefined;
}

export function PublicMediaGallery({ gallery }: { gallery: z.infer<typeof GallerySchema> }) {
  if (gallery.state === 'ready' && !gallery.images.length && !gallery.videos.length) return null;
  return (
    <section aria-label="Galeria institucional" className="as-stack">
      <h3 className="as-title-md">Galeria de fotos e vídeos</h3>
      {gallery.state === 'error' ? <p className="as-meta">Não foi possível carregar a galeria.</p> : (
        <>
          {gallery.images.length ? <GalleryImages images={gallery.images} /> : null}
          {gallery.videos.filter((video) => /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(video.url))
            .map((video, index) => (
              <LinkButton key={video.id} href={video.url}>Assistir vídeo {index + 1}</LinkButton>
            ))}
        </>
      )}
    </section>
  );
}
