import { useState } from 'react';
import type { Integrator } from '../contracts/schemas';
type Product = { id: string; name: string; category: string; summary: string };
export function ProductComparator({ products }: { products: readonly Product[] }) {
  const [ids, setIds] = useState<string[]>([]);
  const selected = products.filter(p => ids.includes(p.id));
  return <section className="as-card as-stack" aria-label="Comparador de produtos">
    <h3 className="as-title-md">Compare até 3 produtos</h3>
    {products.map(p => <label key={p.id} className="as-row"><input type="checkbox" checked={ids.includes(p.id)}
      disabled={!ids.includes(p.id) && ids.length >= 3} onChange={() => setIds(old => old.includes(p.id) ? old.filter(id => id !== p.id) : [...old, p.id])} />{p.name}</label>)}
    {selected.length >= 2 ? <div style={{ overflowX: 'auto' }}><table><caption>Dados informados no catálogo</caption><thead><tr><th scope="col">Critério</th>{selected.map(p => <th scope="col" key={p.id}>{p.name}</th>)}</tr></thead>
      <tbody><tr><th scope="row">Categoria</th>{selected.map(p => <td key={p.id}>{p.category || 'Não informado'}</td>)}</tr>
      <tr><th scope="row">Descrição</th>{selected.map(p => <td key={p.id}>{p.summary || 'Não informado'}</td>)}</tr></tbody></table></div> : <p>Selecione pelo menos dois produtos.</p>}
    <p className="as-meta">Potência, eficiência e garantia exigem especificações técnicas verificadas.</p>
  </section>;
}
export function CoverageGrid({ coverage }: { coverage: Integrator['declared_coverage'] }) {
  const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
  return <section className="as-card as-stack" aria-label="Cobertura declarada por UF">
    <h3 className="as-title-md">Cobertura por UF</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(44px,1fr))', gap: 4 }}>
      {states.map(uf => <span className="as-chip" key={uf} aria-label={uf + (coverage.states.includes(uf) ? ': declarada' : ': não informada')}>
        {uf}{coverage.states.includes(uf) ? ' ✓' : ' –'}</span>)}
    </div>
    <p className="as-meta">Grade de UFs, não mapa geográfico. ✓ declarada; – não informada. Não confirma atendimento.</p>
  </section>;
}
export function QuoteDraft() {
  const [kind, setKind] = useState('Residencial');
  const [consumption, setConsumption] = useState(500);
  const [preview, setPreview] = useState(false);
  return <section className="as-card as-stack" aria-label="Rascunho de orçamento">
    <h3 className="as-title-md">Prepare um orçamento</h3>
    <label>Tipo de projeto <select className="as-input" value={kind} onChange={e => { setKind(e.target.value); setPreview(false); }}>
      <option>Residencial</option><option>Comercial</option><option>Rural</option></select></label>
    <label>Consumo mensal (kWh) <input className="as-input" type="number" min={1} value={Number.isFinite(consumption) ? consumption : ''} onChange={e => { setConsumption(e.target.valueAsNumber); setPreview(false); }} /></label>
    <button type="button" className="as-btn" disabled={!Number.isFinite(consumption) || consumption <= 0} onClick={() => setPreview(true)}>Revisar rascunho</button>
    {preview && <p role="status">{kind} · {consumption} kWh/mês. Rascunho local; nenhuma empresa foi contatada.</p>}
    <p className="as-meta">Envio indisponível até integração autorizada com empresa e confirmação explícita.</p>
  </section>;
}
export function NewsletterPreview() {
  const [consent, setConsent] = useState(false);
  return <section className="as-card as-stack" aria-label="Prévia de newsletter">
    <h3 className="as-title-md">Notícias do setor solar</h3>
    <p>Receba análises e novidades, quando a inscrição estiver disponível.</p>
    <label className="as-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Quero receber novidades por e-mail.</label>
    <button type="button" className="as-btn" disabled>Inscrição indisponível</button>
    <p className="as-meta">Prévia de consentimento; nenhum e-mail coletado ou inscrição realizada.</p>
  </section>;
}
export function ReviewHighlights({ reviews }: { reviews: readonly { id: string; excerpt: string; approved: boolean }[] }) {
  const approved = reviews.filter(r => r.approved);
  return <section className="as-card as-stack" aria-label="Destaques de avaliações">
    <h3 className="as-title-md">Avaliações aprovadas</h3>
    {approved.length ? approved.map(r => <blockquote key={r.id} className="as-break">{r.excerpt}</blockquote>) : <p>Sem trechos públicos disponíveis.</p>}
    <p className="as-meta">Exibe somente trechos públicos recebidos de fonte autorizada; não gera depoimentos.</p>
  </section>;
}
