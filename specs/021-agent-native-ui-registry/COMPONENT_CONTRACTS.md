# Contratos de componentes
O domínio usa Zod/JSON Schema existentes. A camada visual recebe DTO validado, não payload bruto. Exemplo ilustrativo, adaptar nomes aos tipos reais:
```ts
type CompanyListProps = {
  data: { companies: readonly Integrator[]; nextCursor?: string | null };
  actions: { onViewProfile?: (id: number) => void; onViewReputation?: (id: number) => void; onToggleCompare?: (id: number, selected: boolean) => void; onLoadMore?: () => void };
  appearance?: { variant?: 'list' | 'grid' | 'carousel' | 'picker'; density?: 'compact' | 'comfortable' };
  control: { selectedIds: readonly number[]; status: 'loading' | 'ready' | 'refreshing' | 'error' | 'offline'; canCompare: boolean };
};
```
Usar ID estável, ação opcional indisponível não aparece como ativa. Componentes controlados não disparam side effects na renderização. URL de mídia validada pelo bridge; links externos via método existente.

| Bloco | Dados mínimos | Ações | Regras |
|---|---|---|---|
| SolarCompanyCard | ID/name/sede/coverage/verification/reputation | profile/reputation/compare | sede ≠ cobertura; sem preço |
| GeographicFilter | query/category_slug/state/headquarters_city/sort/verified | change/apply/reset | preserve city se compatível; reset explícito |
| CatalogPreview | products/services, state, item IDs | view details | max 3 por grupo conforme schema; sem estoque/price fictício |
| BrandHero | slides habilitados/posição/alt | prev/next | 16:5, fallback, gesto não captura scroll vertical |
| CompanyComparison | companies, matrix, criteria, unknown_fields | hide/back/expand | 2–3; sem vencedor absoluto |
| Reputation | total_approved, average_rating, distribution | detalhes se autorizado | null ≠ 0; amostra explícita |
| EvidenceCard | source_type, data_as_of, limitations | link permitido | não criar digest ou ID fictício |

## MCP
Preservar exatamente `{schema_version,data_as_of,source_type,data,limitations}` em `structuredContent`. `_meta.ui` separado. Se Spec020 aprovar evidence metadata, adaptar via contrato versionado, sem alterar envelope. Manter content textual não dependente do widget. Novos schemas de ações devem ser validados pelo backend, nunca confiar no estado do cliente. Campos opcionais ausentes não se convertem em zero/true. Datas ISO8601; render `Intl` pt-BR; preço só quando dado explícito com moeda. Sem dados de cliente em registry.
