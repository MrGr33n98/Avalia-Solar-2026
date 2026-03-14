# Blog / Articles System Blueprint

Status: `draft`  
Owner sugerido: `PO + Conteúdo + SEO + Backend + Frontend + Growth`  
Última atualização: `2026-03-13`

## Objetivo

Mapear o sistema de blog/articles do Avalia Solar ponta a ponta, cobrindo:

- ActiveAdmin e operação editorial
- modelo e regras de publicação no backend
- API pública de distribuição
- listagem e página de artigo no frontend
- SEO, analytics e conversão
- atores, gates, riscos e evolução recomendada

---

## 1. Executive Summary

O blog/articles já é mais do que uma área de conteúdo estático. Hoje ele funciona como:

- canal editorial e SEO
- camada de descoberta por categoria
- superfície de relacionamento com produto, empresa e categoria
- ponto de entrada para geração de lead
- ativo de distribuição com tracking de consumo e conversão

O sistema já possui uma arquitetura razoável:

- operação editorial no ActiveAdmin
- modelo `Article` com `friendly_id`, status e validações
- API pública com listagem, featured, related, busca, paginação e cache
- páginas frontend de blog index e post detail
- componente de conversão dentro do artigo

O principal gap hoje não é falta de estrutura. O principal gap é falta de uma leitura operacional única do fluxo editorial:

- quem cria
- quem revisa
- quando publica
- qual gate precisa ser satisfeito
- qual impacto isso tem em SEO, conversão e relacionamento com o marketplace

---

## 2. Fontes Estruturais

### Backoffice / Admin

- [articles.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/articles.rb)

### Backend / Modelo e API

- [article.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/article.rb)
- [articles_controller.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/articles_controller.rb)
- [article_serializer.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/serializers/article_serializer.rb)

### Frontend

- [blog/page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/blog/page.tsx)
- [blog/[slug]/page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/blog/[slug]/page.tsx)
- [blog.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/api/blog.ts)
- [ArticleConversionSection.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/ArticleConversionSection.tsx)

---

## 3. Arquitetura Geral

## 3.1 Camadas do sistema

### Camada 1: Operação editorial

O conteúdo é criado e gerido no ActiveAdmin via `Article`.

### Camada 2: Regra de negócio e publicação

O modelo `Article` define:

- slug amigável
- status
- banner
- categoria
- produto relacionado
- autor
- empresas relacionadas
- SEO fields
- publication timing

### Camada 3: Distribuição via API

A API pública entrega:

- índice paginado
- filtro por categoria
- featured posts
- related posts
- ordenação
- busca
- contador de views

### Camada 4: Consumo frontend

O frontend renderiza:

- `/blog`
- `/blog/[slug]`

e transforma o artigo em:

- experiência editorial
- página SEO
- ponto de conversão
- asset de engajamento

---

## 4. Modelo De Dados

## 4.1 Entidade `Article`

O modelo [article.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/article.rb) contém:

- `title`
- `slug`
- `content`
- `excerpt`
- `status`
- `published_at`
- `views_count`
- `meta_title`
- `meta_description`
- `featured`
- `sponsored`
- `sponsored_label`
- `banner`
- `category_id`
- `product_id`
- `author_id`
- relação N:N com `companies`cc

## 4.2 Associações

- `belongs_to :category`
- `belongs_to :product, optional: true`
- `belongs_to :author, class_name: 'AdminUser', optional: true`
- `has_and_belongs_to_many :companies`

### Leitura funcional dessas associações

#### Categoria

Organiza o conteúdo por assunto/cluster SEO.

#### Produto

Conecta conteúdo a uma solução comercial ou categoria de oferta.

#### Autor

Dá identidade editorial e reforça credibilidade.

#### Empresas relacionadas

Permite usar conteúdo como ponte para empresas do marketplace.

---

## 5. Lifecycle Do Artigo

## 5.1 Estados observados

O modelo trabalha com:

- `draft`
- `published`

## 5.2 Gates de publicação

Para `published`, o modelo exige:

- `content` presente
- `published_at` presente

Além disso:

- `slug` deve ser único
- `category` deve existir
- banner, se presente, deve respeitar validações

## 5.3 Gate de banner

Se houver banner:

- tipo permitido: `jpeg`, `png`, `gif`
- limite de tamanho: `5MB`
- dimensão mínima: `200x200`

## 5.4 Interpretação operacional do lifecycle

### Draft

Use quando:

- o conteúdo está em produção
- ainda não passou revisão
- ainda não tem SEO final
- ainda não deve aparecer na API pública

### Published

Use quando:

- texto está aprovado
- slug final está definido
- banner está pronto
- category está correta
- SEO está preenchido
- data de publicação está definida

---

## 6. Fluxo De Informação

## 6.1 Fluxo A: Criação editorial no ActiveAdmin

### Origem

Um `AdminUser` cria ou edita um artigo em [articles.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/articles.rb).

### Campos principais da aba admin

#### Conteúdo

- título
- banner
- slug
- categoria
- produto
- status
- published_at
- featured
- sponsored
- sponsored_label
- author
- excerpt
- content via quill editor

#### Relacionamentos

- empresas relacionadas

#### SEO

- meta_title
- meta_description

### Quem atua

- `AdminUser`
- idealmente: `content_admin`
- eventualmente: `seo_admin` ou `growth_admin`

### Saída

O admin persiste o artigo com todas as associações e metadados necessários para distribuição pública.

---

## 6.2 Fluxo B: Publicação no backend

### Origem

O `Article` sai de `draft` para `published`.

### Gate de negócio

Um artigo só entra no escopo público quando:

- `status == 'published'`
- `published_at <= now`

definido no scope `published`.

### Saída

O artigo passa a:

- aparecer em `/api/v1/articles`
- poder aparecer como featured
- poder aparecer como related
- entrar em sitemap e rotas de blog

---

## 6.3 Fluxo C: Distribuição via API

### Endpoint index

`GET /api/v1/articles`

Capacidades:

- paginação
- busca
- filtro por categoria
- filtro por featured
- filtro por company
- ordenação
- cache

### Endpoint show

`GET /api/v1/articles/:id_or_slug`

Capacidades:

- busca via slug friendly
- incremento de `views_count`
- tracking de `article_view`
- resposta serializada completa

### Endpoint related

`GET /api/v1/articles/:id/related`

Capacidades:

- traz artigos da mesma categoria
- exclui o próprio artigo

### Endpoint featured

`GET /api/v1/articles/featured`

Capacidades:

- lista artigos em destaque
- fallback para mais recentes se não houver featured

---

## 6.4 Fluxo D: Consumo no frontend, página de listagem

Página:

- [blog/page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/blog/page.tsx)

Elementos principais:

- hero do blog
- highlights de categoria
- featured posts
- filtros
- cards de artigo
- sidebar editorial/comercial
- CTA sticky mobile
- newsletter popup

### O que isso significa operacionalmente

A listagem do blog não é só um índice. Ela é uma landing editorial.

Ela precisa equilibrar:

- SEO
- navegação
- descoberta
- leitura
- monetização indireta

---

## 6.5 Fluxo E: Consumo no frontend, página do artigo

Página:

- [blog/[slug]/page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/blog/[slug]/page.tsx)

Elementos principais:

- metadata dinâmica
- JSON-LD de `BlogPosting`
- FAQ schema opcional
- breadcrumb schema
- header do post
- banner
- TOC
- reading tracker
- engagement tracker
- share bar
- article content
- conversion section
- author card
- related posts
- comments

### Interpretação

O artigo já é tratado como:

- asset editorial
- asset SEO
- asset de engajamento
- asset de conversão

---

## 6.6 Fluxo F: Conversão a partir do artigo

Componente:

- [ArticleConversionSection.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/ArticleConversionSection.tsx)

Capacidades:

- exibe monetization block/banner
- oferece CTA para categoria
- oferece CTA para simulador
- possui formulário de lead inline

### Eventos observados

- `blog_lead_form_submit`
- `blog_lead_form_success`
- `blog_conversion`
- `blog_lead_form_error`
- `blog_cta_click`

### Leitura estratégica

O blog já funciona como topo e meio de funil, não apenas awareness.

---

## 7. Quem, Para Quem, Quando

## 7.1 Quem opera

### Content Admin

Responsável por:

- criação
- edição
- revisão editorial
- excerpt
- organização por categoria

### SEO / Growth

Responsável por:

- slug final
- meta title
- meta description
- featured posts
- clusterização por categoria
- priorização de conteúdos de aquisição

### Commercial / Marketplace Ops

Responsável por:

- relações com produto
- relações com empresas
- sponsored content
- sponsored_label
- pontos de conversão

### Backend / Frontend

Responsáveis por:

- entrega correta da API
- renderização
- performance
- tracking
- cache

## 7.2 Para quem o sistema existe

### Usuário final

Consome conteúdo para aprender e tomar decisão.

### SEO / tráfego orgânico

Consome a estrutura do conteúdo via busca, metadata e schema.

### Growth / comercial

Usa o conteúdo para gerar intenção e lead.

### Empresas do marketplace

Podem se beneficiar de associação a conteúdo relevante.

---

## 8. Gates E Permissões

## 8.1 Gates técnicos

- autenticação do admin para criar/editar
- status `draft/published`
- `published_at`
- validação de banner
- slug único

## 8.2 Gates editoriais recomendados

Hoje o sistema parece ter fluxo simples de publicação. Recomenda-se formalizar gates operacionais:

- revisão editorial obrigatória antes de publicar
- revisão SEO obrigatória para artigos estratégicos
- revisão comercial para conteúdo patrocinado

## 8.3 Gates de sponsorship

Campos observados:

- `sponsored`
- `sponsored_label`

Recomendação:

- conteúdo patrocinado não deve ser publicado sem:
  - label clara
  - critério editorial
  - owner comercial

## 8.4 Gates de featured

Campo observado:

- `featured`

Recomendação:

- featured não deve ser tratado só como checkbox
- precisa de política explícita de uso:
  - prioridade por campanha
  - prioridade por cluster SEO
  - prioridade por sazonalidade

---

## 9. SEO, Descoberta E Distribuição

## 9.1 SEO já suportado

- slug amigável
- meta title
- meta description
- open graph
- twitter card
- JSON-LD de artigo
- breadcrumb structured data
- FAQ schema quando aplicável
- sitemap com rotas do blog

## 9.2 Descoberta interna

O blog se conecta com:

- categorias
- busca
- posts relacionados
- conteúdos featured

## 9.3 Oportunidade

O sistema está bem posicionado para virar cluster engine de SEO e aquisição, mas precisa de governança editorial:

- calendário
- taxonomia de intenção
- conteúdo por estágio do funil
- associação de CTA por cluster

---

## 10. Analytics E Conversão

## 10.1 Eventos já visíveis

Backend:

- `article_view`

Frontend:

- leitura e engajamento via trackers
- CTA click
- lead form submit/success/error
- blog conversion

## 10.2 Leitura estratégica

O blog já deveria ser tratado como canal medido em quatro níveis:

- tráfego
- engajamento
- intenção
- conversão

## 10.3 KPIs recomendados

- pageviews por artigo
- CTR em CTA interno
- lead submit rate por artigo
- conversion rate por categoria editorial
- tempo médio de leitura
- scroll depth / read completion
- share rate
- related post CTR

---

## 11. Riscos Do Sistema Atual

### Risco 1

Publicação binária demais: `draft` vs `published`.

Impacto:

- falta stage de revisão
- falta stage de scheduled review

### Risco 2

Conteúdo patrocinado sem workflow editorial dedicado.

Impacto:

- risco reputacional
- risco de perda de confiança

### Risco 3

Featured e sponsored operados como campos simples.

Impacto:

- baixa governança de distribuição

### Risco 4

Associação com empresa e produto sem regra editorial formal.

Impacto:

- conteúdo virar página comercial sem critério

### Risco 5

Views são incrementadas no show sem camada anti-abuso/documentação mais forte.

Impacto:

- métrica de consumo pode inflar

---

## 12. Papéis Recomendados

## 12.1 Content Admin

Pode:

- criar
- editar draft
- manter categorias
- revisar conteúdo

## 12.2 SEO Admin

Pode:

- revisar slug
- revisar metas
- definir featured
- priorizar related / cluster

## 12.3 Commercial Admin

Pode:

- marcar conteúdo patrocinado
- definir sponsored_label
- revisar relações com produto/empresa

## 12.4 Read Only

Pode:

- consultar analytics
- consultar conteúdo
- consultar desempenho editorial

---

## 13. Blueprint De Evolução

## Step 1: Inventário Editorial Canônico

### Objetivo

Mapear todos os campos, relações, usos e consumidores do `Article`.

### Context Brief

Use `Article`, `ArticleSerializer`, `ArticlesController`, `app/blog` e `ActiveAdmin Article`.

### Done quando

- qualquer agente novo entende o sistema editorial sem reler tudo

## Step 2: Workflow Editorial Formal

### Objetivo

Expandir o lifecycle para algo mais robusto.

### Estado alvo sugerido

- `draft`
- `in_review`
- `scheduled`
- `published`
- `archived`

### Done quando

- publicação deixa de ser um toggle binário

## Step 3: Permissões Por Papel

### Objetivo

Separar criação, revisão, SEO e sponsorship.

### Done quando

- nem todo `AdminUser` pode publicar qualquer artigo sem gate

## Step 4: Estratégia De SEO E Clusters

### Objetivo

Transformar o blog em motor de aquisição orgânica.

### Deliverables

- taxonomia de categorias editoriais
- cluster por intenção
- links internos
- política de related content

## Step 5: Conversão Editorial

### Objetivo

Padronizar CTA, lead capture e rastreamento.

### Deliverables

- matriz de CTA por categoria
- taxonomy de eventos de blog
- medição de lead por artigo

## Step 6: Observabilidade Do Canal

### Objetivo

Criar dashboard editorial-operacional.

### Deliverables

- top posts
- posts com maior CTR
- posts com maior lead rate
- posts com baixo desempenho

---

## 14. Definition Of Done

- [ ] O fluxo editorial está documentado ponta a ponta.
- [ ] O blog tem matriz clara de atores e responsabilidades.
- [ ] Existe lifecycle editorial mais maduro.
- [ ] Conteúdo patrocinado tem governance própria.
- [ ] SEO, distribuição e conversão estão amarrados ao processo editorial.
- [ ] O blog deixa de ser “área de posts” e passa a ser “canal operacional de aquisição e confiança”.

