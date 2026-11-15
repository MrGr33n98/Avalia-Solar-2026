# Avalia Solar — Reviews Summary Sheet V2 (modal-only)

**Superfície impactada:** modal `CompanyReviewsSummarySheet` aberto a partir do card do diretório.  
**Não alterar:** `ReviewsPreview`, `OverviewTab`, `CompanyReviews`, `CompanyProfileShell`, hero, banner ou quaisquer estilos da Brand Page.

## Meta UX
Experiência semelhante à referência aprovada: nota forte, distribuição 5★→1★, depoimento aprovado, critérios disponíveis e CTAs. Sem percentuais fictícios.

## Contratos de dados
- Ao abrir o Sheet (e **somente** ao abrir), busca:
  - `companiesApi.getById(companyId)`: `review_aggregates.global.average_rating`, `total_reviews`, `scores_distribution` oficiais.
  - `reviewsApi.getAll({ company_id, status:'approved', limit:1 })`: depoimento mais recente **publicado**, sem agregar amostra para nota.
- A distribuição usa total de reviews do agregado; é exibida somente se cada valor for inteiro não negativo e a soma coincidir exatamente com `total_reviews`.
- Dado indisponível, incoerente ou consulta falha → mensagem discreta “Distribuição por estrelas indisponível”, mantendo nota/total do card como fallback; nenhum percentual calculado sobre amostra parcial.
- Selo “Cliente verificado” somente com `review.verified === true`. Demais pessoas: “Avaliação publicada”.
- Critérios do depoimento: no máximo três `granular_scores` / `review_criterion_scores` reais, nunca notas inferidas.
- O contador e a média do agregado têm precedência sobre valores eventualmente desatualizados do card.
- Nenhuma alteração de API, autenticação, pagamento ou armazenamento.

## Layout
- **Mobile Web / PWA (<640px):** Bottom Sheet verdadeiro (Radix `side="bottom"`), `h=min(90dvh,780px)`, raio superior 20px, cabeçalho fixo, centro rolável, rodapé com CTAs de 44px e suporte à safe area inferior.
- **Desktop (≥640px):** mesmo Sheet responsivo com posicionamento à direita, `max-width:460px`, altura da viewport, entrada lateral; rolamento somente na área central.
- Nota `text-4xl`, estrelas acessíveis (incluindo fração), barras de 6px, texto pequeno mas legível, sem múltiplas bordas redundantes.
- CTAs com os links já fornecidos: `reviewsPath`, `reviewActionPath`. Fechar o modal ao selecionar um link.
- Fechamento com Radix; modal/overlay, controle de foco e tecla Escape herdados de `components/ui/sheet.tsx`.

## Critérios de aceite
| ID | Invariante |
|---|---|
| REV-S01 | Nenhum arquivo/visual da Brand Page alterado |
| REV-S02 | Dado oficial prevalece sobre uma amostra |
| REV-S03 | Barras 5–1 estrelas somente de contagens oficiais consistentes |
| REV-S04 | Empresa sem avaliação não exibe métricas “fantasmas” |
| REV-S05 | Depoimento só de avaliação aprovada |
| REV-S06 | Selo verificado somente quando respaldado pela API |
| REV-S07 | Busca assíncrona só quando modal abre; não há fetch para cards não abertos |
| REV-S08 | Falha na API não derruba modal nem fabrica percentuais |
| REV-S09 | Rodapé fixo e alvo de toque ≥44px no mobile |
| REV-S10 | Links e identidade da empresa preservados |
| REV-S11 | Navegação por teclado/Escape e foco usando primitivas Radix |
| REV-S12 | Jest, TypeScript, CI e smoke Playwright aprovados antes de merge |

## Testes e segurança de entrega
- `CompanyReviewsSummarySheet.spec.tsx`: vazio, preenchido, fonte oficial, integralidade de distribuição, revisão aprovada, verificação, fallback de API, links e layout responsivo.
- Executar em CI no gate de Brand Page e no CI geral; **não desativar** checks de segurança e `build`.
- Sem mudança em migrations/schema — rollback: revert dos commits deste PR.
