import { useState } from 'react';
import type { Integrator } from '../contracts/schemas';
import { selectRecommendations, summarizeDirectory } from '../domain/catalog';
export function CompanyCarousel({ companies }: { companies: readonly Integrator[] }) {
  const [index, setIndex] = useState(0);
  if (!companies.length) return <p>Nenhuma empresa.</p>;
  const current = Math.min(index, companies.length - 1);
  return <section className="as-card as-stack" aria-label="Carrossel de empresas">
    <p className="as-title-md" aria-live="polite">{companies[current].name} ({current + 1}/{companies.length})</p>
    <div className="as-row as-between"><button type="button" className="as-btn" disabled={current === 0} onClick={() => setIndex(current - 1)}>Anterior</button>
    <button type="button" className="as-btn" disabled={current === companies.length - 1} onClick={() => setIndex(current + 1)}>Próxima</button></div>
  </section>;
}
export function FavoriteCompanies({ companies }: { companies: readonly Integrator[] }) {
  const [ids, setIds] = useState<number[]>([]);
  return <section className="as-card as-stack" aria-label="Favoritos da sessão">
    <h3 className="as-title-md">Favoritos ({ids.length})</h3>
    <p className="as-meta">Salvos somente nesta sessão; não sincronizados com sua conta.</p>
    {companies.map(c => <button type="button" className="as-btn" key={c.id} aria-pressed={ids.includes(c.id)}
      onClick={() => setIds(old => old.includes(c.id) ? old.filter(id => id !== c.id) : [...old, c.id])}>{ids.includes(c.id) ? 'Remover' : 'Favoritar'} {c.name}</button>)}
  </section>;
}
export function TrustEvidence({ company }: { company: Integrator }) {
  return <section className="as-card as-stack" aria-label="Evidências de confiança">
    <h3 className="as-title-md">Evidências de confiança</h3>
    <p>Cadastro: {company.verification_state === 'platform_verified' ? 'Verificado' : 'Não verificado'}</p>
    <p>Avaliações: {company.rating_count}</p>
    <p>Nota: {company.rating_average ?? 'Não atribuída'}</p>
    <p className="as-meta">Não é um score de qualidade; metodologia de pontuação ainda não aprovada.</p>
  </section>;
}
export function DirectoryIntelligence({ companies }: { companies: readonly Integrator[] }) {
  const data = summarizeDirectory(companies);
  return <section className="as-card as-stack" aria-label="Indicadores da seleção">
    <h3 className="as-title-md">Indicadores da seleção carregada</h3>
    <p>Empresas: {data.total} · Verificadas: {data.verified} · Avaliadas: {data.reviewed}</p>
    <p className="as-meta">Não representa participação nem crescimento do mercado.</p>
  </section>;
}
export function Recommendations({ companies }: { companies: readonly Integrator[] }) {
  const [category, setCategory] = useState('');
  const categories = [...new Map(companies.flatMap(c => c.categories).map(c => [c.slug, c])).values()];
  const matches = selectRecommendations(companies, category);
  return <section className="as-card as-stack" aria-label="Empresas compatíveis">
    <label>Categoria <select className="as-input" value={category} onChange={e => setCategory(e.target.value)}>
      <option value="">Todas</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
    <p aria-live="polite">{matches.length} empresas compatíveis na seleção carregada.</p>
    {matches.map(c => <div key={c.id}>{c.name}</div>)}
    <p className="as-meta">Filtro explícito por categoria, sem classificação de melhor empresa.</p>
  </section>;
}
