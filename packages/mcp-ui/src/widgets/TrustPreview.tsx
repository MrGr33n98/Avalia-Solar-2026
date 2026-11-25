import { z } from 'zod';

const Schema = z.object({
  state: z.enum(['ready', 'error']),
  badges: z.array(z.object({ id: z.number(), name: z.string(), image_url: z.string().nullable() })).max(4),
  faqs: z.array(z.object({ id: z.number(), question: z.string(), answer: z.string() })).max(4),
});
const Envelope = z.object({ data: z.object({ integrator: z.object({ trust_preview: Schema }) }) });
export function readTrustPreview(raw: unknown) {
  const parsed = Envelope.safeParse(raw);
  return parsed.success ? parsed.data.data.integrator.trust_preview : undefined;
}
export function TrustPreview({ trust }: { trust: z.infer<typeof Schema> }) {
  if (trust.state === 'error') return <p className="as-meta">Selos e FAQ temporariamente indisponíveis.</p>;
  return (
    <div className="as-stack">
      {trust.badges.length ? <section className="as-stack" aria-label="Selos atribuídos">
        <h3 className="as-title-md">Selos e conquistas</h3>
        <div className="as-row as-wrap">{trust.badges.map((badge) => (
          <span className="as-chip as-break" key={badge.id}>{badge.name}</span>
        ))}</div>
      </section> : null}
      {trust.faqs.length ? <section className="as-stack" aria-label="Perguntas frequentes">
        <h3 className="as-title-md">Perguntas frequentes</h3>
        {trust.faqs.map((faq) => <details className="as-card" key={faq.id}>
          <summary className="as-break" style={{ cursor: 'pointer' }}>{faq.question}</summary>
          <p className="as-break">{faq.answer}</p>
        </details>)}
      </section> : null}
    </div>
  );
}
