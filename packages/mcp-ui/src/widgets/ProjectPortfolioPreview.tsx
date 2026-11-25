import { useState } from 'react';
import { z } from 'zod';
import { sanitizeExternalHttpsUrl } from '../bridge/capabilities';
import { GalleryImages } from './PublicMediaGallery';

const ProjectSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  city: z.string(),
  state: z.string(),
  technology: z.string(),
  segment: z.string(),
  capacity_value: z.number().positive().nullable(),
  capacity_unit: z.string(),
  cover_url: z.string().nullable(),
  gallery_images: z.array(z.string()).max(4).optional(),
});

export const PortfolioPreviewSchema = z.object({
  state: z.enum(['ready', 'unavailable', 'error']),
  items: z.array(ProjectSchema).max(3),
  has_more: z.boolean(),
});
const PortfolioEnvelope = z.object({
  data: z.object({ integrator: z.object({ portfolio_preview: PortfolioPreviewSchema }) }),
});
type Portfolio = z.infer<typeof PortfolioPreviewSchema>;

export function readPortfolioPreview(raw: unknown): Portfolio | undefined {
  const parsed = PortfolioEnvelope.safeParse(raw);
  return parsed.success ? parsed.data.data.integrator.portfolio_preview : undefined;
}

function ProjectCover({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = sanitizeExternalHttpsUrl(url);
  return (
    <div style={{ aspectRatio: '4 / 3', background: 'var(--as-bg-muted)', overflow: 'hidden' }}>
      {src && !failed ? (
        <img src={src} alt="Foto do projeto" loading="lazy" onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <span className="as-meta" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          Sem foto disponível
        </span>
      )}
    </div>
  );
}

export function ProjectPortfolioPreview({ portfolio }: { portfolio: Portfolio }) {
  if (portfolio.state === 'unavailable') return null;
  return (
    <section className="as-stack" aria-label="Portfólio de projetos">
      <h3 className="as-title-md">Projetos realizados</h3>
      {portfolio.state === 'error' ? <p className="as-meta">Não foi possível carregar os projetos.</p> : null}
      {portfolio.state === 'ready' && !portfolio.items.length ? <p className="as-meta">Nenhum projeto publicado.</p> : null}
      {portfolio.state === 'ready' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 8 }}>
          {portfolio.items.map((project) => (
            <article className="as-card as-stack" key={project.id} style={{ padding: 8 }}>
              <ProjectCover key={project.cover_url ?? 'empty'} url={project.cover_url} />
              <h4 className="as-title-md as-break">{project.title}</h4>
              <span className="as-meta as-break">{[project.city, project.state].filter(Boolean).join(' · ')}</span>
              {project.capacity_value !== null ? (
                <strong className="as-break">{project.capacity_value.toLocaleString('pt-BR')} {project.capacity_unit}</strong>
              ) : null}
              {project.technology ? <span className="as-meta as-break">{project.technology}</span> : null}
              {project.summary ? <p className="as-meta as-break" style={{ margin: 0 }}>{project.summary}</p> : null}
              {project.gallery_images?.length ? (
                <details>
                  <summary className="as-meta" style={{ cursor: 'pointer', minHeight: 44 }}>Fotos do projeto</summary>
                  <GalleryImages images={project.gallery_images} />
                </details>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {portfolio.state === 'ready' && portfolio.has_more ? (
        <p className="as-meta">Prévia de até 3 projetos. Consulte o perfil oficial para mais.</p>
      ) : null}
    </section>
  );
}
