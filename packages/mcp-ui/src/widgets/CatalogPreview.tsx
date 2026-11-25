import { useState } from 'react';
import { z } from 'zod';
import { sanitizeExternalHttpsUrl } from '../bridge/capabilities';
import { LinkButton } from '../design/primitives';

const ItemSchema = z.object({
  id: z.string(), name: z.string(), summary: z.string(), category: z.string(),
  image_url: z.string().nullable(), detail_url: z.string().nullable(),
});
const CatalogSchema = z.object({
  state: z.enum(['ready', 'error']),
  products: z.array(ItemSchema).max(3),
  services: z.array(ItemSchema).max(3),
});
const Envelope = z.object({ data: z.object({ integrator: z.object({ catalog_preview: CatalogSchema }) }) });
type Item = z.infer<typeof ItemSchema>;
export function readCatalogPreview(raw: unknown) {
  const parsed = Envelope.safeParse(raw);
  return parsed.success ? parsed.data.data.integrator.catalog_preview : undefined;
}
function ItemCard({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  const src = sanitizeExternalHttpsUrl(item.image_url);
  return (
    <article className="as-card as-stack" style={{ padding: 8 }}>
      <div style={{ aspectRatio: '1', background: 'var(--as-bg-muted)', overflow: 'hidden' }}>
        {src && !failed ? <img src={src} alt={item.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={() => setFailed(true)} /> : <span className="as-meta">Sem imagem disponível</span>}
      </div>
      <h4 className="as-title-md as-break">{item.name}</h4>
      <span className="as-meta as-break">{item.category}</span>
      {item.summary ? <p className="as-meta as-break" style={{ margin: 0 }}>{item.summary}</p> : null}
      {item.detail_url?.startsWith('https://www.avaliasolar.com.br/') ? (
        <LinkButton href={item.detail_url}>Ver detalhes</LinkButton>
      ) : null}
    </article>
  );
}
export function CatalogPreview({ catalog }: { catalog: z.infer<typeof CatalogSchema> }) {
  if (catalog.state === 'error') return <p className="as-meta">Catálogo temporariamente indisponível.</p>;
  return (
    <>
      {([{ title: 'Produtos', items: catalog.products }, { title: 'Serviços', items: catalog.services }])
        .filter(({ items }) => items.length > 0).map(({ title, items }) => (
          <section key={title} className="as-stack" aria-label={title}>
            <h3 className="as-title-md">{title}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 8 }}>
              {items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
            <span className="as-meta">Prévia de até 3 itens. Consulte o perfil oficial para mais.</span>
          </section>
        ))}
    </>
  );
}
