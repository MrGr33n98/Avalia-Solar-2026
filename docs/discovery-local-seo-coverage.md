# Discovery — Local SEO, Coverage e Principais Cidades

Data da auditoria: 2026-06-10

Escopo desta fase: auditar, mapear riscos e recomendar engenharia para páginas locais, coverage estruturado e links de cidades no rodapé. Nenhum código de produção, rota, migration, footer, Active Admin ou página local foi alterado nesta fase.

## 1. Estado atual

- A listagem pública de empresas já existe em `/companies` e aceita filtros por query string, incluindo `state`, `city`, `category_ids`, `featured`, `verified`, `min_rating`, paginação e ordenação.
- A URL `/companies?state=SC` funciona usando o campo principal `companies.state`, não os campos de coverage.
- O perfil público da empresa existe em `/companies/[id]`, usando ID ou slug, com redirect canônico quando necessário.
- O backend Rails possui `coverage_states` e `coverage_cities`, mas ambos estão como `text` livre no banco.
- O Active Admin já permite editar `coverage_states` e `coverage_cities`, porém como textarea, sem normalização visual por UF/cidade.
- O frontend tem filtros de localização baseados em `/api/v1/companies/states` e `/api/v1/companies/cities`, mas esses endpoints retornam dados do dataset brasileiro, não necessariamente cidades com empresas.
- O rodapé é global nas páginas públicas, mas ainda não possui bloco “Energia Solar por cidade”.
- Já existe uma infraestrutura antiga/paralela de landing pages em `/solucoes/[slug]` usando `seo_landing_pages`, mas ela não é a rota proposta `/companies/energia-solar/[state]/[city]` e não reutiliza diretamente a listagem pública de empresas.
- O sitemap inclui rotas estáticas, empresas e categorias, mas não inclui páginas locais por cidade.
- O MobiVolt/lead matching já usa `coverage_states` e `coverage_cities` parcialmente, mas depende de parsing de texto livre e consultas pouco indexáveis.

Conclusão: a base para localização existe, mas coverage, SEO local, footer e matching por cidade ainda não têm contrato único e normalizado.

## 2. Backend Rails

### Arquivos principais auditados

- `AB0-1-back/app/models/company.rb`
- `AB0-1-back/app/controllers/api/v1/companies_controller.rb`
- `AB0-1-back/app/serializers/company_serializer.rb`
- `AB0-1-back/config/routes.rb`
- `AB0-1-back/app/services/locations/br_locations.rb`
- `AB0-1-back/app/services/lead_distribution_service.rb`
- `AB0-1-back/app/services/chat/mobivolt/company_matcher_service.rb`
- `AB0-1-back/app/controllers/api/v1/seo_pages_controller.rb`
- `AB0-1-back/app/models/seo_landing_page.rb`

### Model `Company`

Scopes encontrados:

| Scope | Existe? | Observação |
| --- | --- | --- |
| `active` | Sim | Filtra empresas com status ativo. |
| `featured` | Sim | Filtra empresas em destaque. |
| `verified` | Sim | Filtra empresas verificadas. |
| `by_state` | Sim | Usa `state`, não `coverage_states`. |
| `by_city` | Sim | Usa `city`, não `coverage_cities`. |
| `ordered` | Sim | Ordenação padrão do model. |
| `ordered_by_priority` | Sim | Considera patrocinado, prioridade, rating e nome. |
| `published` | Não encontrado | O conceito atual parece estar em `status = active`. |
| `sponsored` | Não encontrado como scope | Existe campo booleano, mas não scope dedicado. |
| `by_coverage_state` | Não encontrado | Necessário para SEO local e matching estruturado. |
| `by_coverage_city` | Não encontrado | Necessário para páginas locais e matching por cidade. |

### Endpoints atuais

| Endpoint | Uso atual | Observações |
| --- | --- | --- |
| `GET /api/v1/companies` | Listagem pública e filtros | Usa `status = active` por padrão. |
| `GET /api/v1/companies/:id` | Perfil público por ID/slug | Busca por ID inicial ou slug. |
| `GET /api/v1/companies/by_slug/:slug` | Fallback por slug | Usado pelo client seguro. |
| `GET /api/v1/companies/states` | Lista de UFs | Retorna todos os estados do dataset brasileiro. |
| `GET /api/v1/companies/cities?state=SC` | Lista de cidades por UF | Retorna cidades do dataset, não apenas com empresas. |
| `GET /api/v1/companies/locations` | Localizações cadastradas | Usa `Company.distinct.pluck(:state, :city)`. |
| `GET /api/v1/companies/featured` | Empresas em destaque | Usa empresas ativas e featured. |
| `GET /api/v1/categories/:id/companies` | Empresas por categoria | Filtra por categoria, estado e cidade principal. |
| `GET /api/v1/seo_pages/:slug` | Landing SEO antiga | Alimenta `/solucoes/[slug]`. |

### Filtros da listagem pública

Fluxo atual resumido de `GET /api/v1/companies`:

```ruby
@companies = Company.includes(...)
@companies = @companies.where(status: params[:status]) if params[:status].present?
@companies = @companies.where(status: Company.statuses[:active]) unless params[:status].present?
@companies = @companies.search_by_text(params[:q]) if params[:q].present?
@companies = @companies.where(featured: value) if params[:featured].present?
@companies = @companies.where(verified: value) if params[:verified].present?
@companies = @companies.where(state: states) if params[:state].present?
@companies = @companies.where(city: cities) if params[:city].present?
@companies = @companies.where('rating_avg >= ?', params[:min_rating]) if params[:min_rating].present?
@companies = @companies.joins(:categories).where(categories: { id: ids }) if category filters exist
```

Ordenação atual:

- Padrão: `rating_avg desc`, `rating_count desc`, `created_at desc`.
- `recommended`: `featured desc`, `rating_avg desc`, `rating_count desc`, `created_at desc`.
- Também há ordenações por rating, reviews, nome e criação.
- `sponsored` e `priority_score` existem no banco e são usados em serviços/escopos, mas não aparecem como fator explícito na ordenação padrão do endpoint público.

Paginação:

- A API usa paginação quando `page` é enviado pelo frontend.
- O frontend envia `page`, `per_page` e espera `data`, `pagination` e total.

N+1:

- A listagem usa `includes(:categories, :badges, :company_faqs, :company_buttons, :plan, ...)`, o que reduz N+1.
- Ainda há risco em chamadas de serializer que filtram/ordenam associações já carregadas de forma diferente, principalmente badges, financing e agregados.
- Antes de páginas locais em escala, é recomendável rodar logs SQL/Bullet em `/companies` e na futura rota local com `per_page=12`.

Pontos seguros para adicionar filtro futuro por coverage:

- O menor impacto é adicionar lógica opcional separada para páginas locais, sem alterar o comportamento padrão de `/companies?state=SC`.
- Evitar trocar o significado atual de `state` e `city`. Esses filtros hoje significam cidade/estado principal da empresa.
- Criar parâmetro explícito futuro, por exemplo `serves_state`, `serves_city` ou endpoint dedicado para páginas locais, evitando regressão nos filtros existentes.
- Se permanecer em campos `text`, evitar `LIKE` amplo em alta escala; usar normalização controlada, cache ou migrar para relação/JSONB indexável.

## 3. Banco de dados

### Campos atuais relevantes em `companies`

| Campo | Tipo atual | Onde é usado | Risco de alteração | Recomendação |
| --- | --- | --- | --- | --- |
| `name` | `string`, obrigatório | Listagem, perfil, busca full-text, slug, SEO | Alto se renomear ou mudar validação | Manter. |
| `slug` | `string`, obrigatório, único | Perfil público e canonical | Alto; quebra URLs públicas | Manter e preservar redirects. |
| `description` | `text` | Perfil, listagem, full-text, SEO | Médio; afeta busca e schema | Manter. |
| `city` | `string` | Filtro `/companies?city=`, perfil, schema, matching | Alto se mudar sem migração | Manter como cidade principal. |
| `state` | `string` | Filtro `/companies?state=`, perfil, schema, matching | Alto se mudar sem migração | Manter como UF principal. |
| `coverage_cities` | `text` | Active Admin, LeadDistribution, MobiVolt | Alto para matching; texto livre inconsistente | Normalizar via UI controlada no MVP; migrar depois para estrutura relacional. |
| `coverage_states` | `text` | Active Admin, LeadDistribution, MobiVolt | Alto para matching e performance | Salvar UFs canônicas; preparar relação futura. |
| `category` | Não é coluna | Relação via categorias/joins | Criar coluna duplicaria fonte de verdade | Manter relação existente. |
| `status` | `string`, enum | Publicação, acesso, filtros | Alto; controla visibilidade pública | Manter enum atual. |
| `rating_avg` | `decimal` | Ordenação, perfil, schema | Médio; impacta ranking | Usar como rating público. |
| `rating_count` | `integer` | Ordenação, agregados | Médio | Manter. |
| `reviews_count` | `integer` | Métricas e serviços legados | Médio por possível duplicidade com `rating_count` | Não remover; consolidar semântica depois. |
| `verified` | `boolean` | Filtro, perfil, ranking indireto | Baixo se mantido | Não renomear para `is_verified` internamente. |
| `sponsored` | `boolean` | Ranking/serviços, potencial destaque | Médio; monetização | Criar scope futuro, não renomear para `is_sponsored`. |
| `priority_score` | `integer` | `ordered_by_priority`, matching | Médio | Usar em páginas locais se houver regra de ranking patrocinado. |
| `active_admin` | `boolean` | LeadDistribution exige empresa ativa no admin | Médio; aprovação operacional | Definir se páginas públicas também devem exigir esse gate. |
| `plan_id` | `bigint` | Plano/feature access | Médio; permissões comerciais | Não alterar. |
| `plan_status` | `string` | Plano/feature access | Médio | Não alterar. |
| `latitude` | `decimal(10,6)` | Perfil/schema/geolocalização | Baixo | Manter. |
| `longitude` | `decimal(10,6)` | Perfil/schema/geolocalização | Baixo | Manter. |

### Coverage atual

- `coverage_states` é `text`.
- `coverage_cities` é `text`.
- Não são arrays, JSONB nem associações relacionais.
- Não há índice específico para coverage.
- Há índices para `state`, `city`, `status`, `slug`, ranking e GIN em alguns campos JSONB, mas não para `coverage_*`.

### Estados, cidades e normalização

- Não foram encontradas tabelas relacionais `states` ou `cities`.
- A normalização de estados/cidades usa o arquivo `AB0-1-back/config/data/br_locations.json` através de `Locations::BrLocations`.
- O serviço valida UF e cidade por dataset, com normalização por transliteração para cidade.
- Não há slug persistido de cidade.
- Não há serviço robusto de CEP/geocoding identificado; existem campos `latitude` e `longitude`, mas não pipeline de geocodificação.

### SEO landing pages já existentes

- Existe tabela `seo_landing_pages` com `slug`, `category_id`, `city_name`, `state_abbr` e `metadata_cache`.
- Existe rota backend `GET /api/v1/seo_pages/:slug`.
- Existe rota frontend `/solucoes/[slug]`.
- Existe task `seo:generate_pages`, mas ela cria páginas do tipo `paineis-solares-em-cidade-uf`, não a estrutura `/companies/energia-solar/[state]/[city]`.
- Essa estrutura pode ser reaproveitada conceitualmente, mas não substitui a rota local recomendada porque não está ligada ao ranking/listagem real de empresas.

## 4. Active Admin

### Diagnóstico do formulário atual

- Arquivo principal: `AB0-1-back/app/admin/companies.rb`.
- `permit_params` inclui `coverage_states` e `coverage_cities`.
- `state` é renderizado como select de estados a partir de `Locations::BrLocations.states`.
- `city` é renderizado como select dependente, inicialmente vazio/desabilitado, com `data-selected`.
- `coverage_states` e `coverage_cities` são renderizados em um bloco “Coverage” como textareas.
- Há uso de Select2 em outros campos, especialmente categorias, mas não no coverage.
- Há checkboxes para arrays como `project_types`, `niche_tags` e `services_offered`.
- A sidebar de plano/features parece informativa e não interfere diretamente no salvamento de coverage.
- Importações/admin validações já usam `Locations::BrLocations.valid_state?` e `valid_city?` para cidade principal.

### Problemas do coverage como texto livre

- O admin pode salvar “Capitais e regiões metropolitanas”, “São José”, “Sao Jose”, “Grande Florianópolis” ou listas misturadas sem contrato.
- Matching por cidade fica inconsistente.
- Páginas locais podem ficar vazias ou incompletas.
- Queries com `LIKE` em texto livre serão lentas e propensas a falso positivo.
- Fica difícil garantir sitemap e footer sem links para páginas vazias.

### Sugestão de melhoria

- Na próxima fase, trocar a UI de coverage por seleção controlada.
- Estados: multiselect/checkbox de UFs, salvando UFs canônicas (`SC, PR, RS`).
- Cidades: multiselect dependente por estado, salvando nomes canônicos do dataset (`Florianópolis, São José, Palhoça`).
- Manter parser compatível com dados antigos para não perder coverage já cadastrado.
- Exibir alerta administrativo para entradas não reconhecidas, como “Capitais e regiões metropolitanas”.

## 5. Frontend Next.js

### Stack e rotas

- O frontend usa Next.js App Router.
- A listagem principal está em `AB0-1-front/app/companies/page.tsx`.
- O client da listagem está em `AB0-1-front/app/companies/CompaniesPageClient.tsx`.
- O perfil público está em `AB0-1-front/app/companies/[id]/page.tsx`.
- A rota por categorias está em `AB0-1-front/app/companies/categorias/[...categorySlugs]/page.tsx`.
- A landing SEO antiga está em `AB0-1-front/app/solucoes/[slug]/page.tsx`.

### Componentes relevantes

- `AB0-1-front/components/filters/FilterSidebar.tsx`
- `AB0-1-front/components/filters/LocationFilter.tsx`
- `AB0-1-front/components/filters/query.ts`
- `AB0-1-front/components/company/CompanyCard.tsx`
- `AB0-1-front/components/Footer.tsx`
- `AB0-1-front/components/layout/ConditionalFooter.tsx`
- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/app/sitemap.ts`
- `AB0-1-front/app/robots.ts`

### Reaproveitamento recomendado

- Reutilizar `CompaniesPageClient` se a rota local puder receber `state`, `city` e categorias forçadas sem duplicar lógica.
- Caso o SEO precise de HTML server-rendered mais forte, extrair uma camada de listagem/card reutilizável para server/client boundary clara.
- Reutilizar `CompanyCard`, paginação, filtros laterais e JSON-LD de `ItemList`.
- Reutilizar helpers de categoria existentes em `lib/seo/companies-category-url` como referência para canonical/redirect.

### Pontos que podem quebrar a listagem atual

- Alterar semântica de `state` e `city` para incluir coverage quebraria `/companies?state=SC`.
- Trocar query params atuais por rotas locais sem redirect preservado quebraria links existentes.
- Mudar o formato de resposta de `/api/v1/companies` quebraria `companiesApiSafe.getAllPaginated`.
- Inserir footer dinâmico sem cache pode degradar TTFB em páginas públicas.
- Criar rota local como `/companies/energia-solar` de um único segmento pode conflitar conceitualmente com slug de empresa; a rota recomendada com quatro segmentos evita esse problema.

## 6. Rotas públicas

### Rotas atuais

| Rota | Status | Observação |
| --- | --- | --- |
| `/companies` | Existe | Página pública de empresas. |
| `/companies?state=SC` | Existe | Filtro por UF principal da empresa. |
| `/companies?city=Florianópolis` | Suportada pela API/client | Depende de cidade exata. |
| `/companies/categorias/[...categorySlugs]` | Existe | Canonical por categorias. |
| `/companies/[id]` | Existe | Perfil por ID/slug. |
| `/solucoes/[slug]` | Existe | Landing SEO antiga baseada em `seo_landing_pages`. |

### Nova rota local proposta

Rota futura recomendada:

```text
/companies/energia-solar/[state]/[city]
```

Exemplos:

- `/companies/energia-solar/sc/florianopolis`
- `/companies/energia-solar/sc/sao-jose`
- `/companies/energia-solar/sc/palhoca`
- `/companies/energia-solar/sc/joinville`

Viabilidade:

- O App Router suporta essa rota com `app/companies/energia-solar/[state]/[city]/page.tsx`.
- Ela não conflita com `/companies/[id]`, porque `/companies/[id]` captura apenas um segmento após `/companies`.
- É necessário reservar o prefixo `energia-solar` e evitar criar uma rota local curta `/companies/energia-solar` sem tratamento explícito.

Slug de cidade:

- Usar `parameterize`/transliteração: `Florianópolis` -> `florianopolis`, `São José` -> `sao-jose`.
- Resolver slug para cidade legível usando `Locations::BrLocations` ou um mapa frontend gerado a partir do mesmo dataset.
- Sempre validar `state` como UF.
- Em caso de slug inválido, retornar `notFound()` no frontend ou 404 no backend.

Arquivos a criar na próxima fase:

- `AB0-1-front/app/companies/energia-solar/[state]/[city]/page.tsx`
- Helper frontend para resolver UF/cidade por slug, por exemplo `AB0-1-front/lib/locations/local-page-slugs.ts`
- Serviço backend ou scope para empresas que atendem cidade/UF.
- Testes de rota, metadata e canonical.

## 7. Footer e páginas locais no rodapé

### Footer atual

- `AB0-1-front/components/Footer.tsx` renderiza o rodapé.
- Links e contatos são centralizados em `AB0-1-front/lib/site.ts`.
- `AB0-1-front/components/layout/ConditionalFooter.tsx` oculta o footer em rotas internas como `/dashboard`, `/company-dashboard`, `/admin`, `/painel` e `/control`.
- O footer aparece nas páginas públicas, incluindo `/companies`, `/companies?state=SC` e perfis públicos.
- A estrutura atual é responsiva e pode receber uma nova coluna/bloco sem alterar rotas.

### Onde adicionar o bloco futuro

- Criar uma lista centralizada em `AB0-1-front/lib/site.ts`, por exemplo `FOOTER_LOCAL_SOLAR_LINKS`.
- Renderizar no `Footer.tsx` como nova coluna ou bloco abaixo das colunas atuais.
- No mobile, manter links empilhados e limitar a lista inicial para não alongar demais o footer.

### Avaliação das opções

| Opção | Diagnóstico | Risco | Recomendação |
| --- | --- | --- | --- |
| Hardcoded inicial | Mais rápido; bom para SC e MVP | Pode linkar páginas vazias se não houver critério | Aceitável apenas com lista controlada. |
| Dinâmica por endpoint | Escalável e baseada em empresas reais | Exige backend, cache e estabilidade de ranking | Boa para fase posterior. |
| Híbrida | Começa com lista controlada e prepara endpoint/cache | Requer disciplina para não virar lista manual eterna | Melhor caminho para próxima fase. |

Recomendação: opção híbrida. Começar com uma lista controlada de SC, publicar apenas páginas que tenham resultado ou valor estratégico, e preparar endpoint/cache para popular cidades automaticamente depois.

## 8. Páginas locais recomendadas

### Lista inicial para Santa Catarina

Prioridade 1:

- `/companies/energia-solar/sc/florianopolis`
- `/companies/energia-solar/sc/sao-jose`
- `/companies/energia-solar/sc/palhoca`

Prioridade 2:

- `/companies/energia-solar/sc/joinville`
- `/companies/energia-solar/sc/blumenau`
- `/companies/energia-solar/sc/itajai`
- `/companies/energia-solar/sc/balneario-camboriu`

Prioridade 3:

- `/companies/energia-solar/sc/chapeco`
- `/companies/energia-solar/sc/criciuma`
- `/companies/energia-solar/sc/jaragua-do-sul`

### Futuro nacional

- `/companies/energia-solar/sp/sao-paulo`
- `/companies/energia-solar/rj/rio-de-janeiro`
- `/companies/energia-solar/pr/curitiba`
- `/companies/energia-solar/mg/belo-horizonte`
- `/companies/energia-solar/rs/porto-alegre`
- `/companies/energia-solar/ba/salvador`
- `/companies/energia-solar/df/brasilia`

### Critério para cidade entrar no footer

Uma cidade deve entrar no footer quando atender pelo menos um critério:

- Possuir 3 ou mais empresas ativas que atendem a cidade, considerando cidade principal ou coverage normalizado.
- Ser cidade estratégica de SEO.
- Ser capital ou região metropolitana prioritária.
- Possuir empresa patrocinada ou verificada atuando na região.

### Critério para evitar página local vazia

- Não indexar página sem empresa e sem conteúdo editorial real.
- Não incluir no sitemap páginas sem empresas ativas/aptas.
- Não colocar no footer páginas que retornem lista vazia.
- Para cidades estratégicas sem 3 empresas, usar regra explícita: página indexável só se houver pelo menos 1 empresa verificada/patrocinada ou conteúdo local suficiente.

## 9. Perfil da empresa

### Diagnóstico atual

- Rota: `/companies/[id]`.
- O perfil renderiza `city`, `state`, endereço, rating, categorias, dados comerciais e schema `LocalBusiness`.
- Há JSON-LD de `LocalBusiness` no server component.
- Há `BreadcrumbJsonLd` no client, com trilha baseada em Home, Empresas, categoria e empresa.
- Não foi encontrado uso visível de `coverage_cities` ou `coverage_states` no perfil público.
- Não há link explícito “Ver outras empresas de energia solar em Florianópolis/SC”.
- Não há breadcrumb local no formato `Início > Empresas > Energia Solar > SC > Florianópolis > Empresa`.
- O serializer público atual não expõe `coverage_states` e `coverage_cities`, então o frontend não consegue renderizar “Também atende...” sem alteração futura de API/serializer.

### Recomendação futura

- Adicionar breadcrumb local quando a empresa tiver `state` e `city` válidos:
  - `Início > Empresas > Energia Solar > SC > Florianópolis > Empresa`
- Adicionar link contextual:
  - `Ver outras empresas de energia solar em Florianópolis/SC`
- Adicionar coverage público quando houver dados normalizados:
  - `Também atende São José, Palhoça, Biguaçu e região`
- Não expor coverage textual antigo sem normalização, pois pode gerar conteúdo ruim para usuário, SEO e IA.

### Observação sobre aprovação operacional

- O `CompaniesController#update` permite atualização por usuário autorizado sem forçar automaticamente `status = pending`.
- `active_admin` é usado no `LeadDistributionService`, mas a listagem pública padrão usa `status = active` e não aparenta exigir `active_admin`.
- Se a regra de negócio desejada é “empresa edita e Felipe aprova no Active Admin antes de publicar”, isso deve virar uma fase própria, pois envolve fluxo de revisão, payloads, permissões e estados. Não deve ser misturado com a criação das páginas locais.

## 10. SEO/Sitemap/Schema

### O que já existe

- `AB0-1-front/app/robots.ts` gera robots para o app.
- `AB0-1-front/public/robots.txt` também existe com referência a sitemap.
- `AB0-1-front/app/sitemap.ts` gera sitemap dinâmico.
- O sitemap já inclui rotas estáticas, posts, categorias e empresas ativas.
- `/companies` possui metadata, canonical e Open Graph.
- `/companies/categorias/[...categorySlugs]` possui metadata dinâmica e canonical por categoria.
- `/companies/[id]` gera metadata dinâmica e JSON-LD `LocalBusiness`.
- `CompaniesPageClient` gera JSON-LD `CollectionPage`, `ItemList` e itens `LocalBusiness` para a lista visível.
- `/solucoes/[slug]` gera metadata, `LocalBusiness` e `FAQPage` para a landing antiga.

### O que falta para SEO local

- Rota local indexável em `/companies/energia-solar/[state]/[city]`.
- Canonical específico para cada cidade.
- Metadata local com cidade/UF e categoria.
- `BreadcrumbList` local.
- Inclusão seletiva das páginas locais no sitemap.
- Critério para não indexar páginas vazias.
- Conteúdo local real no HTML inicial.
- Links internos a partir do footer e dos perfis.
- Eventual `llms.txt` com páginas estratégicas, se o projeto decidir manter esse arquivo.

### Riscos de indexação

- Páginas locais vazias podem gerar thin content.
- Cidades sem slug canônico podem gerar duplicidade: `sao-jose`, `são-josé`, `sao jose`.
- Sitemap com páginas sem empresas pode prejudicar rastreamento.
- Footer com links vazios cria má experiência e sinal ruim.
- Canonical incorreto pode competir com `/companies?state=SC` ou `/solucoes/[slug]`.

### Plano posterior para GEO/LLMO

- Criar páginas locais com HTML server-rendered, dados reais, schema e links internos.
- Adicionar conteúdo descritivo curto por cidade baseado em dados reais, sem texto genérico excessivo.
- Incluir `ItemList` com empresas que atendem a cidade.
- Incluir `LocalBusiness` para empresas da lista.
- Incluir `BreadcrumbList`.
- Avaliar `FAQPage` apenas quando houver perguntas úteis e não duplicadas em massa.
- Publicar somente páginas com critério mínimo de qualidade.

## 11. Matching/MobiVolt AI

### Diagnóstico atual

- `LeadDistributionService` usa empresas ativas e `active_admin`, com fallback por cidade/estado.
- `LeadDistributionService` considera `company.state`, `company.city`, `coverage_states` e `coverage_cities`, mas faz parsing de texto.
- `Chat::Mobivolt::CompanyMatcherService` prefiltra por `state` ou `coverage_states LIKE`, depois calcula score com cidade principal, coverage city, estado principal e coverage state.
- O parser do MobiVolt identifica estado/cidade com `Locations::BrLocations`.
- O lead sync grava cidade/estado no lead.
- A serialização segura do MobiVolt expõe cidade/estado e link do perfil, mas não coverage.

### Impacto do coverage em texto livre

- Cidades sem acento podem não casar com cidades acentuadas em todos os serviços.
- Separadores aceitos não são idênticos entre serviços.
- `coverage_states LIKE` pode gerar falso positivo e não usa índice.
- Cidades genéricas como “Capitais e regiões metropolitanas” não são acionáveis para matching.
- Serviços diferentes podem recomendar empresas diferentes para a mesma cidade.

### Recomendação para MobiVolt

- Criar uma fonte única de normalização para coverage.
- Usar coverage estruturado para score e elegibilidade.
- Evitar `LIKE` em texto livre em produção.
- Ordenar recomendação combinando:
  - cidade exata;
  - coverage city;
  - estado exato;
  - coverage state;
  - `sponsored`;
  - `verified`;
  - `priority_score`;
  - `rating_avg` e volume de avaliações.
- Só migrar o MobiVolt depois que o Admin e a API tiverem contrato claro, para evitar regressão em leads.

## 12. Riscos encontrados

- Quebrar `/companies?state=SC` ao mudar o significado de `state`.
- Quebrar `/companies/[slug]` se a rota local for desenhada com catch-all ou segmento ambíguo.
- Criar conflito conceitual entre slug de empresa e `/companies/energia-solar`.
- Gerar slug incorreto para cidades com acento, como `São José` e `Balneário Camboriú`.
- Manter coverage antigo em texto livre sem parser compatível.
- Empresas com coverage genérico, como “Capitais e regiões metropolitanas”, não serem mapeáveis para páginas locais.
- Criar páginas locais vazias.
- Colocar no footer links para páginas sem resultado.
- Incluir no sitemap páginas sem empresas.
- Usar queries `LIKE` em texto e causar lentidão.
- Fazer checkbox com todas as cidades do Brasil sem UX adequada.
- Criar N+1 em páginas locais com cards, badges, categorias e reviews.
- Ter inconsistência entre cidade principal e cidades atendidas.
- Duplicar cidade principal dentro de `coverage_cities`.
- Expor coverage no perfil com texto ruim ou não validado.
- Publicar empresas pendentes se `status` e `active_admin` não forem alinhados como regra de visibilidade.
- Misturar fluxo de aprovação de edição com SEO local na mesma mudança.

## 13. Alternativas de implementação

### Alternativa A — Texto atual com tags controladas

Vantagens:

- Menor mudança de banco.
- Implementação rápida no Active Admin.
- Reduz erro de digitação se as tags forem bem controladas.

Desvantagens:

- Continua sendo texto livre no banco.
- Ainda é difícil consultar com performance.
- Não resolve bem CEP, sitemap automático e ranking por cidade.
- Pode manter inconsistência entre serviços.

Uso recomendado: apenas se o objetivo for melhoria visual mínima e temporária.

### Alternativa B — Checkboxes/multiselect salvando texto separado por vírgula

Vantagens:

- Baixo risco para o banco atual.
- Mantém payloads e colunas existentes.
- Permite UX clara no Admin.
- Padroniza UFs e cidades usando dataset existente.
- É rápida para MVP de footer e primeiras páginas locais.

Desvantagens:

- Ainda exige parser.
- Ainda não é ideal para queries em alta escala.
- Precisa cuidado para não usar `LIKE` amplo.
- A migração futura para relacional ainda será necessária.

Uso recomendado: melhor opção para a próxima fase de baixo risco, desde que acompanhada de normalização e testes.

### Alternativa C — Estrutura relacional

Estrutura proposta:

- `states`
- `cities`
- `company_coverage_states`
- `company_coverage_cities`

Vantagens:

- Melhor para SEO, GEO, matching, CEP e páginas locais automáticas.
- Permite índices, contagem por cidade e footer dinâmico.
- Reduz falso positivo.
- Facilita sitemap com páginas que realmente têm empresas.
- Facilita auditoria e manutenção no Admin.

Desvantagens:

- Exige migrations.
- Exige migração de dados antigos.
- Exige adaptação de Active Admin, API, MobiVolt e serializers.
- Maior risco se feita direto sem fase de normalização.

Uso recomendado: arquitetura alvo de médio prazo.

## 14. Recomendação técnica

Recomendação principal: executar uma estratégia híbrida.

1. Próxima fase: implementar a Alternativa B.
   - Usar multiselect/checkbox no Active Admin.
   - Salvar nos campos atuais `coverage_states` e `coverage_cities`.
   - Normalizar UFs e cidades pelo dataset existente.
   - Manter compatibilidade com dados antigos.
   - Não alterar o significado de `state` e `city`.

2. Em paralelo, definir contrato de slug/localização.
   - `state` sempre UF minúscula na URL.
   - `city` sempre slug transliterado.
   - Resolver slug usando dataset oficial.
   - Retornar 404 para cidade inválida.

3. Para páginas locais, usar endpoint/filtro explícito de “empresas que atendem a cidade”.
   - Não reaproveitar silenciosamente `city` se a intenção for incluir coverage.
   - Evitar quebra de `/companies?state=SC`.

4. Footer: usar opção híbrida.
   - Começar com lista SC controlada.
   - Só publicar links para páginas com resultado ou valor estratégico.
   - Preparar endpoint dinâmico futuro.

5. Médio prazo: migrar para Alternativa C.
   - Criar tabelas normalizadas.
   - Migrar dados antigos.
   - Trocar MobiVolt e páginas locais para joins indexáveis.

Essa recomendação equilibra menor risco e rapidez agora, sem bloquear escalabilidade, CEP e SEO local futuro.

## 15. Plano de execução proposto

### Fase 1 — Contrato de localização e dados

- Definir helper único para UF, nome de cidade e slug.
- Validar cidades com `Locations::BrLocations`.
- Criar parser compatível para `coverage_states` e `coverage_cities`.
- Gerar relatório de entradas inválidas atuais.

Arquivos prováveis:

- `AB0-1-back/app/services/locations/br_locations.rb`
- Novo service/helper de coverage no backend.
- Novo helper frontend em `AB0-1-front/lib/locations/`.

### Fase 2 — Active Admin coverage controlado

- Trocar textareas por multiselect/checkbox.
- Estados selecionados controlam lista de cidades.
- Salvar texto canônico separado por vírgula.
- Mostrar entradas antigas inválidas sem descartá-las automaticamente.

Arquivos prováveis:

- `AB0-1-back/app/admin/companies.rb`
- JS/CSS admin existente, se necessário.

### Fase 3 — API segura para empresas que atendem cidade

- Adicionar filtro explícito sem alterar `state`/`city`.
- Garantir paginação e ordenação.
- Decidir se `active_admin` será gate público além de `status`.
- Testar `/companies?state=SC` para regressão.

Arquivos prováveis:

- `AB0-1-back/app/controllers/api/v1/companies_controller.rb`
- `AB0-1-back/app/models/company.rb`
- `AB0-1-back/app/serializers/company_serializer.rb`, se coverage precisar aparecer no perfil.

### Fase 4 — Rota local Next.js

- Criar `/companies/energia-solar/[state]/[city]`.
- Gerar metadata dinâmica, canonical, Open Graph e JSON-LD.
- Reutilizar cards/listagem existentes.
- Resolver slug acentuado para cidade legível.
- Retornar 404 ou noindex quando não houver critério de qualidade.

Arquivos prováveis:

- `AB0-1-front/app/companies/energia-solar/[state]/[city]/page.tsx`
- `AB0-1-front/app/companies/CompaniesPageClient.tsx`, se precisar aceitar modo local.
- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/lib/locations/local-page-slugs.ts`

### Fase 5 — Footer local controlado

- Criar lista inicial SC centralizada.
- Renderizar bloco “Energia Solar por cidade”.
- Garantir responsividade mobile.
- Evitar links sem página publicada.

Arquivos prováveis:

- `AB0-1-front/lib/site.ts`
- `AB0-1-front/components/Footer.tsx`

### Fase 6 — Sitemap, perfil e MobiVolt

- Incluir páginas locais qualificadas no sitemap.
- Adicionar link local no perfil da empresa.
- Adicionar breadcrumbs locais.
- Ajustar MobiVolt para usar o mesmo contrato de coverage.

Arquivos prováveis:

- `AB0-1-front/app/sitemap.ts`
- `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`
- `AB0-1-front/app/companies/[id]/page.tsx`
- `AB0-1-back/app/services/chat/mobivolt/company_matcher_service.rb`
- `AB0-1-back/app/services/lead_distribution_service.rb`

### Fase 7 — Migração relacional futura

- Criar tabelas `states`, `cities`, `company_coverage_states` e `company_coverage_cities`.
- Migrar texto antigo.
- Adicionar índices.
- Trocar filtros locais para joins.
- Remover dependência operacional de parsing de texto.

## 16. Checklist de aceite para a próxima fase

- `/companies?state=SC` continua funcionando com o mesmo significado.
- `/companies/[slug]` continua funcionando e com canonical preservado.
- Coverage no Admin usa seleção controlada, não digitação livre.
- Dados antigos de `coverage_states` e `coverage_cities` não são perdidos.
- Slugs de cidades com acento resolvem para o nome correto.
- A futura rota `/companies/energia-solar/[state]/[city]` não conflita com slug de empresa.
- Página local sem empresa não entra no footer nem no sitemap.
- Footer local usa lista controlada ou endpoint cacheado.
- Sitemap inclui apenas páginas locais qualificadas.
- Perfil da empresa ganha link local sem expor coverage inválido.
- MobiVolt usa a mesma normalização de cidade/UF que a rota local.
- Ordenação local define claramente peso de `sponsored`, `verified`, rating e prioridade.
- Decisão explícita tomada sobre uso de `active_admin` como gate público.
- Testes de regressão cobrem listagem por estado, cidade, categoria e perfil.
- Logs SQL confirmam ausência de N+1 relevante na página local.
