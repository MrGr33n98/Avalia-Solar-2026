# Scan de referência mcpcn
Inventário de 30 blocos no registry consultado, 2 libs (`event-shared`, `shared-types`) e tema `apps-sdk-theme`. Upstream MIT; copiar avisos. O dump anexado contém docs, exemplos, utilitários e estrutura, não garante todos os arquivos do registry; revalidar commit e JSON de cada item no W0. A documentação List contém product-list e table. `ProductList` expõe `data`, `actions`, `appearance`, `control` e variantes list/grid/carousel/picker. O código de referência usa defaults de varejo, EUR, seleção por índice, `slice`, Base UI, Lucide e classes Tailwind; não copiar esses comportamentos literalmente.

| Grupo | Bloco upstream | Componente próprio | Wave | Adaptação |
|---|---|---|---|---|
| form | contact-form | QuoteRequestForm | W9 | Adaptar campos e confirmação; sem envio no MVP |
| form | date-time-picker | TechnicalVisitScheduler | W10 | Timezone e disponibilidade reais |
| form | issue-report-form | ReportCompanyForm | W10 | Moderação, consentimento |
| payment | order-confirm | QuoteRequestConfirmation | W9 | Revisão explícita sem checkout |
| payment | payment-confirmed | SubscriptionConfirmation | W10 | Somente status confirmado pelo backend |
| payment | amount-input | EnergyBillInput | W9 | BRL, validação decimal |
| list | product-list | SolarProductList / SolarCompanyList / CompanyComparisonPicker | W3/W4/W5 | Lista/grid/carrossel/picker; sem carrinho ou fixtures |
| list | table | CompanyComparisonTable / BenchmarkTable | W5/W10 | Tabela semântica, escopo privado para benchmark |
| selection | option-list | CategorySelector | W3 | IDs de categorias |
| selection | tag-select | GeographicFilter | W3 | Estado/cidade e cobertura distintas |
| selection | quick-reply | SolarQuickActions | W3 | Ações permitidas |
| status | progress-steps | QuoteProgress / VerificationProgress | W9 | Status real de workflow |
| status | status-badge | VerifiedBadge / AchievementBadge | W2 | Não confundir selo com certificação |
| misc | stat-card | ReputationStatCard / RankingCard | W6 | Denominador, data, fonte |
| misc | hero | BrandHero | W4 | Preservar 16:5 e fallback |
| blogging | post-card | ReviewCard | W6 | Avaliação aprovada e privacidade |
| blogging | post-list | CompanyReviewList | W6 | Paginação; somente se contrato disponível |
| blogging | post-detail | ProjectCaseStudy | W8 | Dados públicos autorizados |
| messaging | message-bubble | CompanyMessageBubble | W10 | Escopo privado |
| messaging | chat-conversation | SolarConsultationChat | W10 | Sem automação de envio não aprovada |
| social | x-post | CompanyNewsCard | W12 | Sem embeds externos arbitrários |
| social | instagram-post | CompanyInstagramPost | W12 | Somente mídia licenciada |
| social | linkedin-post | CompanyLinkedInPost | W12 | Dados autorizados |
| social | youtube-post | CompanyVideoCard | W8 | Thumbnail e link seguro |
| map | map-carousel | SolarIntegratorMap | W8 | Leaflet e tiles exigem CSP e orçamento |
| events | event-card | SolarEventCard | W12 | Novo domínio de dados |
| events | event-list | SolarEventDirectory | W12 | Novo domínio de dados |
| events | event-detail | SolarEventDetail | W12 | Novo domínio de dados |
| events | ticket-tier-select | SolarEventRegistration | W12 | Sem pagamento automático |
| events | event-confirmation | RegistrationConfirmation | W12 | Somente confirmação real |

## Procedimento de scan por item
Registrar URL, commit, sha256, licença, dependências npm/registry transitivas, exports, props, slots, estados, CSS, tamanho, URLs externas, side effects, teclado e toque. Classificar: reuse / port / reference only / reject / deferred. Verificar peer deps React18; fazer spike isolado. Comparar versão renderizada com baseline. Nunca declarar que todos os 30 foram portados se apenas catalogados.
