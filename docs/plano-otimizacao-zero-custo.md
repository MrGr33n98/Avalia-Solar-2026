# Plano de Otimização Zero Custo — Avalia Solar

> **Objetivo**: Transformar a plataforma de nota **5.8/10** para **7.5+/10** sem nenhum investimento financeiro adicional, usando apenas a VM atual.
> **Prazo total**: ~2 semanas de trabalho dev
> **Custo**: R$ 0,00

---

## Visão Geral do Estado Atual vs Estado Futuro

| Dimensão | 🔴 Estado Atual | 🎯 Estado Futuro | Métrica de Sucesso |
|---|---|---|---|
| **LCP Mobile** | ~6s+ | < 2.5s | PageSpeed Insights ≥ 75 mobile |
| **Peso da Landing (mobile)** | ~12-15MB | < 2MB | DevTools Network < 2MB |
| **Payload API** | ~100KB sem compressão | ~20KB gzipped | Response header `Content-Encoding: gzip` |
| **Requests Simultâneas** | 10 (Puma single) | 20-40 (clustered) | `ab -n 100 -c 40` sem timeout |
| **Second Visit** | ~3-5s | < 1s | Cache-Control headers presentes |
| **SEO Landing** | CSR (HTML vazio) | SSR (HTML completo) | `curl` retorna conteúdo no HTML |
| **Score Lighthouse** | ~40-50 mobile | ~75-85 mobile | Lighthouse CI |
| **TypeScript** | Erros ignorados | Build limpo | `next build` sem `ignoreBuildErrors` |
| **Score Auditoria** | 5.8/10 | 7.5/10 | Reauditoria pós-execução |

---

## FASE 1 — Quick Wins Imediatos

> **Prazo**: 1 dia | **Impacto**: Alto | **Risco**: Baixíssimo

---

### TASK 1.1 — Ativar Gzip/Brotli no Nginx

| Campo | Detalhe |
|---|---|
| **Arquivo** | `infra/nginx/app.avaliasolar.com.br.conf` |
| **Esforço** | 30 minutos |
| **Estado Atual** | Nginx serve responses sem compressão. Payloads JSON da API chegam ao browser com tamanho bruto (~100KB por listagem de empresas). |
| **Estado Futuro** | Todas responses text/json/css/js comprimidas com gzip nível 6. Payloads reduzidos em 70-80%. |
| **Requisito Mínimo** | Header `Content-Encoding: gzip` presente em responses da API |

#### Subtasks

- [ ] **1.1.1** Abrir `infra/nginx/app.avaliasolar.com.br.conf`
- [ ] **1.1.2** Adicionar bloco gzip dentro do contexto `http` ou `server`:
  ```nginx
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_min_length 256;
  gzip_comp_level 6;
  gzip_types
    text/plain
    text/css
    text/javascript
    application/javascript
    application/json
    application/xml
    image/svg+xml
    font/woff2;
  ```
- [ ] **1.1.3** Testar configuração: `nginx -t`
- [ ] **1.1.4** Reload: `nginx -s reload`
- [ ] **1.1.5** Validar: `curl -H "Accept-Encoding: gzip" -I https://api.avaliasolar.com.br/api/v1/categories` → verificar `Content-Encoding: gzip`

#### Critérios de Aceitação

- [x] `Content-Encoding: gzip` presente nas responses
- [x] Payload de `/api/v1/categories` < 30KB (vs ~100KB anterior)
- [x] Zero downtime durante deploy

---

### TASK 1.2 — Ativar HTTP/2 no Nginx

| Campo | Detalhe |
|---|---|
| **Arquivo** | `infra/nginx/app.avaliasolar.com.br.conf` |
| **Esforço** | 15 minutos |
| **Estado Atual** | HTTP/1.1 — cada request abre conexão separada ou aguarda na fila. Landing faz 3-5 requests sequenciais. |
| **Estado Futuro** | HTTP/2 com multiplexing — múltiplas requests na mesma conexão TCP simultânea. |
| **Requisito Mínimo** | `curl --http2 -I https://avaliasolar.com.br` retorna `HTTP/2 200` |

#### Subtasks

- [ ] **1.2.1** Localizar diretiva `listen 443 ssl;` no config do Nginx
- [ ] **1.2.2** Alterar para `listen 443 ssl http2;`
- [ ] **1.2.3** Testar: `nginx -t`
- [ ] **1.2.4** Reload: `nginx -s reload`
- [ ] **1.2.5** Validar: `curl --http2 -I https://avaliasolar.com.br`

#### Critérios de Aceitação

- [x] Response usa protocolo HTTP/2
- [x] DevTools → Network → Protocol mostra `h2`

---

### TASK 1.3 — Cache Headers para Assets Estáticos no Nginx

| Campo | Detalhe |
|---|---|
| **Arquivo** | `infra/nginx/app.avaliasolar.com.br.conf` |
| **Esforço** | 30 minutos |
| **Estado Atual** | Assets estáticos (imagens, fontes, CSS, JS do Next.js) servidos sem `Cache-Control` explícito no Nginx. Browser pode re-baixar a cada visita. |
| **Estado Futuro** | Assets imutáveis cacheados por 1 ano. Imagens por 30 dias. Second-visit instantâneo. |
| **Requisito Mínimo** | Header `Cache-Control: public, max-age=...` em assets estáticos |

#### Subtasks

- [ ] **1.3.1** Adicionar location blocks no Nginx:
  ```nginx
  # Assets Next.js (hash no nome = imutáveis)
  location /_next/static/ {
      expires 365d;
      add_header Cache-Control "public, immutable";
  }

  # Imagens e fontes
  location ~* \.(webp|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
      expires 30d;
      add_header Cache-Control "public, no-transform";
  }

  # CSS e JS
  location ~* \.(css|js)$ {
      expires 7d;
      add_header Cache-Control "public";
  }
  ```
- [ ] **1.3.2** Testar: `nginx -t`
- [ ] **1.3.3** Reload: `nginx -s reload`
- [ ] **1.3.4** Validar: `curl -I https://avaliasolar.com.br/_next/static/...` → `Cache-Control: public, immutable`

#### Critérios de Aceitação

- [x] `/_next/static/` retorna `max-age=31536000, immutable`
- [x] Imagens retornam `max-age=2592000`
- [x] Second-visit no DevTools → quase tudo `(from cache)`

---

### TASK 1.4 — Ativar Puma Clustered Mode

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-back/config/puma.rb` |
| **Esforço** | 30 minutos |
| **Estado Atual** | Puma roda em **single-mode** (1 worker, 10 threads). Capacity = 10 requests simultâneas. Uma request lenta bloqueia 1 dos 10 slots. CPU multi-core subutilizada. |
| **Estado Futuro** | Puma em **clustered mode** (2-4 workers, 10 threads cada). Capacity = 20-40 requests simultâneas. Copy-on-Write (CoW) economiza RAM. |
| **Requisito Mínimo** | `Puma starting in cluster mode` no log de boot |
| **Pré-requisito** | Verificar RAM disponível: `free -h` na VM. Se < 4GB: usar 2 workers. Se ≥ 4GB: usar 3. Se ≥ 8GB: usar 4. |

#### Subtasks

- [ ] **1.4.1** Verificar RAM disponível na VM: `free -h`
- [ ] **1.4.2** Verificar pool do database.yml: `pool` deve ser ≥ `threads × workers`
- [ ] **1.4.3** Abrir `config/puma.rb`
- [ ] **1.4.4** Descomentar: `workers ENV.fetch("WEB_CONCURRENCY") { 2 }`
- [ ] **1.4.5** Descomentar: `preload_app!`
- [ ] **1.4.6** Setar `WEB_CONCURRENCY` no `.env` ou `docker-compose.yml` (2 ou 3 conforme RAM)
- [ ] **1.4.7** Ajustar pool no `database.yml` se necessário (ex: `pool: 30`)
- [ ] **1.4.8** Rebuild e restart do container backend
- [ ] **1.4.9** Validar logs: `docker logs backend | grep "cluster mode"`
- [ ] **1.4.10** Testar carga: `ab -n 100 -c 20 https://api.avaliasolar.com.br/api/v1/categories`

#### Critérios de Aceitação

- [x] Log mostra `Puma starting in cluster mode with X workers`
- [x] `ab -c 20` sem requests falhando
- [x] Tempo de response p95 estável
- [x] `docker stats` mostra RAM aceitável (< 80% da VM)

---

## FASE 2 — Otimização de Imagens

> **Prazo**: 1 dia | **Impacto**: Crítico (P0) | **Risco**: Baixo

---

### TASK 2.1 — Converter PNGs Pesadas para WebP

| Campo | Detalhe |
|---|---|
| **Diretório** | `AB0-1-front/public/` e `AB0-1-front/public/images/` |
| **Esforço** | 2-3 horas |
| **Estado Atual** | 6 PNGs de 5-7MB cada (ícones de categoria) + hero 1.8MB + textura 1.9MB. Total ~43MB servidos sem compressão. Visitante mobile pode baixar 7MB em uma única imagem. |
| **Estado Futuro** | Todas imagens > 500KB convertidas para WebP com qualidade 80. Total ~4.6MB. Cada imagem < 1MB. |
| **Requisito Mínimo** | Zero PNGs > 1MB no diretório `public/` |

#### Subtasks

- [ ] **2.1.1** Instalar cwebp localmente: `npm i -g cwebp-bin` ou download manual
- [ ] **2.1.2** Listar todas imagens > 500KB: `Get-ChildItem -Recurse public/ -Include *.png,*.jpg | Where {$_.Length -gt 500KB}`
- [ ] **2.1.3** Converter cada imagem:
  ```
  cwebp -q 80 instaladores-ev-avalia-solar.png -o instaladores-ev-avalia-solar.webp
  cwebp -q 80 residencial-e-condominio-avalia-solar.png -o residencial-e-condominio-avalia-solar.webp
  cwebp -q 80 instaladores-solar-avalia-solar.png -o instaladores-solar-avalia-solar.webp
  cwebp -q 80 energia-solar-avalia-solar.png -o energia-solar-avalia-solar.webp
  cwebp -q 80 rural-avaliasolar.png -o rural-avaliasolar.webp
  cwebp -q 80 carport-avalia-solar.png -o carport-avalia-solar.webp
  cwebp -q 80 lp-avalia-solar-image.png -o lp-avalia-solar-image.webp
  cwebp -q 80 herro-banner-avalia-solar.png -o herro-banner-avalia-solar.webp
  cwebp -q 85 texture-avalia-solar-v2.png -o texture-avalia-solar-v2.webp
  ```
- [ ] **2.1.4** Validar qualidade visual de cada WebP (abrir no browser)
- [ ] **2.1.5** Buscar todas referências `.png` no código: `grep -r "instaladores-ev-avalia-solar.png" --include="*.tsx" --include="*.ts" --include="*.css"`
- [ ] **2.1.6** Atualizar referências de `.png` → `.webp` em todos os componentes
- [ ] **2.1.7** Atualizar referência no `globals.css` (textura body::before)
- [ ] **2.1.8** `npm run build` para verificar que nada quebrou
- [ ] **2.1.9** Remover PNGs originais (ou mover para pasta `_originals/` como backup)

#### Critérios de Aceitação

- [x] `Get-ChildItem public/ -Recurse -Include *.png | Where {$_.Length -gt 1MB}` retorna **zero** resultados
- [x] Todas as páginas renderizam imagens corretamente (visual spot-check)
- [x] `npm run build` passa sem erros
- [x] Peso total de imagens no `public/` < 10MB

---

### TASK 2.2 — Remover Imagens Duplicadas

| Campo | Detalhe |
|---|---|
| **Arquivo** | `public/pricing-hero-mockup.png` (duplicado em `public/images/pricing/`) |
| **Esforço** | 15 minutos |
| **Estado Atual** | `pricing-hero-mockup.png` (~2.5MB) existe em 2 locais. Ocupa ~5MB desnecessários. |
| **Estado Futuro** | Uma única cópia WebP. Referências atualizadas. |
| **Requisito Mínimo** | Zero duplicatas de imagens |

#### Subtasks

- [ ] **2.2.1** Identificar qual local é referenciado no código
- [ ] **2.2.2** Converter para WebP a versão canônica
- [ ] **2.2.3** Remover a duplicata
- [ ] **2.2.4** Atualizar referências
- [ ] **2.2.5** Validar no build

---

### TASK 2.3 — Desabilitar Textura de Fundo no Mobile

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-front/app/globals.css` |
| **Esforço** | 15 minutos |
| **Estado Atual** | `body::before` carrega textura (1.9MB PNG / ~150KB WebP) em **TODAS** as páginas, inclusive mobile. Em 4G, adiciona ~3s ao carregamento. |
| **Estado Futuro** | Mobile não carrega textura. Desktop carrega versão WebP leve. |
| **Requisito Mínimo** | `body::before { display: none }` em telas < 768px |

#### Subtasks

- [ ] **2.3.1** Abrir `app/globals.css`
- [ ] **2.3.2** Localizar `body::before` com a textura
- [ ] **2.3.3** Adicionar media query:
  ```css
  @media (max-width: 768px) {
    body::before {
      display: none !important;
    }
  }
  ```
- [ ] **2.3.4** Validar: DevTools → responsive mode → textura não aparece

#### Critérios de Aceitação

- [x] DevTools em 375px (iPhone): `body::before` não renderiza
- [x] DevTools em 1440px (Desktop): textura aparece normalmente
- [x] Zero CLS causado pela mudança

---

### TASK 2.4 — Implementar `next/image` com `priority` no Hero

| Campo | Detalhe |
|---|---|
| **Arquivo** | Componente do Hero da landing page |
| **Esforço** | 1 hora |
| **Estado Atual** | Hero image provavelmente usa `<img>` nativo ou `Image` sem `priority`. Browser baixa a imagem tardiamente = LCP alto. |
| **Estado Futuro** | Hero usa `<Image priority>` que gera `<link rel="preload">` automaticamente. Browser inicia download da LCP image **imediatamente**. |
| **Requisito Mínimo** | `<link rel="preload" as="image">` no HTML da landing |

#### Subtasks

- [ ] **2.4.1** Identificar componente hero da landing
- [ ] **2.4.2** Trocar `<img>` por `<Image>` de `next/image` (se não for já)
- [ ] **2.4.3** Adicionar prop `priority` na imagem above-the-fold
- [ ] **2.4.4** Definir `width` e `height` explícitos (evita CLS)
- [ ] **2.4.5** Validar: `curl https://avaliasolar.com.br | grep "preload"`

#### Critérios de Aceitação

- [x] HTML da landing contém `<link rel="preload" as="image">`
- [x] LCP image carrega antes do JavaScript executar
- [x] Zero CLS (dimensões definidas)

---

## FASE 3 — Backend Performance

> **Prazo**: 2 dias | **Impacto**: Alto | **Risco**: Médio

---

### TASK 3.1 — Criar CompanyListSerializer (Payload Leve)

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-back/app/serializers/company_list_serializer.rb` (novo) |
| **Esforço** | 1 dia |
| **Estado Atual** | `CompanySerializer` (348 linhas, 34+ atributos, associações profundas) é usado tanto para listagem quanto para detalhe. Payload de listagem carrega `faqs`, `financing_partners`, `financing_offers`, `review_aggregates` — dados que não são exibidos em cards. |
| **Estado Futuro** | `CompanyListSerializer` retorna apenas campos necessários para cards (~10-12 atributos). `CompanyDetailSerializer` mantém payload completo. |
| **Requisito Mínimo** | Payload de `/api/v1/companies` < 50% do tamanho atual |

#### Subtasks

- [ ] **3.1.1** Mapear quais campos o frontend usa em cards de listagem (nome, slug, logo, rating, reviews_count, cidade, estado, categoria, badges)
- [ ] **3.1.2** Criar `CompanyListSerializer` com apenas esses campos
- [ ] **3.1.3** Atualizar `companies_controller.rb` → `index` para usar `CompanyListSerializer`
- [ ] **3.1.4** Manter `CompanySerializer` (renomear para `CompanyDetailSerializer`) no `show`
- [ ] **3.1.5** Verificar que o frontend consome apenas os campos retornados
- [ ] **3.1.6** Medir tamanho do payload antes/depois
- [ ] **3.1.7** Testar: todos os cards renderizam corretamente

#### Critérios de Aceitação

- [x] Payload de `GET /api/v1/companies` **< 50%** do tamanho original
- [x] Cards de empresa renderizam sem quebra
- [x] `GET /api/v1/companies/:slug` mantém payload completo
- [x] Zero N+1 queries (verificar com Bullet)

---

### TASK 3.2 — Remover `table_exists?` do CompanySerializer

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-back/app/serializers/company_serializer.rb` |
| **Esforço** | 30 minutos |
| **Estado Atual** | `ReviewAggregate.table_exists?` é chamado em **cada serialização** de empresa. É uma query `SELECT 1 FROM information_schema.tables WHERE table_name = 'review_aggregates'` — desnecessária após o boot. |
| **Estado Futuro** | Check removido ou movido para um initializer (executado 1x no boot). |
| **Requisito Mínimo** | Zero chamadas `table_exists?` durante requests |

#### Subtasks

- [ ] **3.2.1** Localizar `table_exists?` no serializer
- [ ] **3.2.2** Substituir por constante definida no boot:
  ```ruby
  # config/initializers/table_checks.rb
  REVIEW_AGGREGATE_TABLE_EXISTS = ActiveRecord::Base.connection.table_exists?(:review_aggregates) rescue false
  ```
- [ ] **3.2.3** Usar a constante no serializer
- [ ] **3.2.4** Testar em development e staging

---

### TASK 3.3 — Implementar HTTP Caching (ETag/304) em Endpoints Públicos

| Campo | Detalhe |
|---|---|
| **Arquivos** | Controllers de `categories`, `banners`, `companies` (index público) |
| **Esforço** | 1 dia |
| **Estado Atual** | Cada request pública retorna **200 OK** com payload completo, mesmo que os dados não tenham mudado. A landing faz 3+ requests a cada visita = mesmo dado baixado repetidamente. |
| **Estado Futuro** | Endpoints públicos retornam **304 Not Modified** quando dados não mudaram. Browser usa cache local. Zero bytes transferidos na maioria dos reloads. |
| **Requisito Mínimo** | Header `ETag` presente nas responses. Segundo request retorna `304`. |

#### Subtasks

- [ ] **3.3.1** Adicionar `stale?` / `fresh_when` ao `categories_controller#index`:
  ```ruby
  def index
    categories = Category.active.ordered
    if stale?(categories)
      render json: categories, each_serializer: CategorySerializer
    end
  end
  ```
- [ ] **3.3.2** Repetir para `banners_controller#index`
- [ ] **3.3.3** Repetir para `companies_controller#index` (listagem pública/featured)
- [ ] **3.3.4** Testar: 1ª request → 200 + ETag. 2ª request com `If-None-Match` → 304
- [ ] **3.3.5** Validar: `curl -I` mostra header `ETag`

#### Critérios de Aceitação

- [x] `ETag` header presente em responses de endpoints públicos
- [x] Request com `If-None-Match: <etag>` retorna `304 Not Modified`
- [x] `304` response tem body vazio (zero bytes)
- [x] Dados atualizados invalidam ETag automaticamente

---

### TASK 3.4 — Lazy Load de Bibliotecas Pesadas no Frontend

| Campo | Detalhe |
|---|---|
| **Arquivos** | Componentes que importam `recharts`, `leaflet`, `framer-motion` pesado |
| **Esforço** | 2 horas |
| **Estado Atual** | Recharts (~150KB), Leaflet (~40KB) e partes de Framer Motion podem ser carregados em páginas onde não são usados, dependendo do code splitting. |
| **Estado Futuro** | Cada biblioteca carregada apenas na rota que precisa, via `next/dynamic`. |
| **Requisito Mínimo** | Bundle da landing page não contém recharts ou leaflet |

#### Subtasks

- [ ] **3.4.1** Verificar quais páginas importam `recharts`: `grep -r "from 'recharts'" --include="*.tsx"`
- [ ] **3.4.2** Verificar quais páginas importam `leaflet`: `grep -r "from 'leaflet'" --include="*.tsx"`
- [ ] **3.4.3** Envolver componentes de gráfico com `dynamic(() => import(...), { ssr: false })`
- [ ] **3.4.4** Envolver componentes de mapa com `dynamic(() => import(...), { ssr: false })`
- [ ] **3.4.5** Rodar `npm run analyze` para verificar que chunks foram separados
- [ ] **3.4.6** Validar: landing page não baixa chunks de recharts/leaflet

#### Critérios de Aceitação

- [x] `npm run analyze` mostra recharts em chunk separado (não no main bundle)
- [x] Network tab da landing não carrega chunks de gráfico/mapa
- [x] Gráficos no dashboard funcionam normalmente
- [x] Mapa na busca funciona normalmente

---

## FASE 4 — SEO e Renderização

> **Prazo**: 3-5 dias | **Impacto**: Alto (tráfego orgânico) | **Risco**: Médio-Alto

---

### TASK 4.1 — Migrar Landing Page para Server Components

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-front/app/page.tsx` e componentes filhos |
| **Esforço** | 3-5 dias |
| **Estado Atual** | `app/page.tsx` usa seções com `'use client'`. Dados (categorias, empresas featured, banners) são fetched client-side via TanStack Query. HTML inicial é um esqueleto sem conteúdo. Googlebot indexa mas com menor eficiência. |
| **Estado Futuro** | `page.tsx` é Server Component. Dados obtidos via `fetch()` no servidor. HTML entregue já contém listas de categorias, empresas, cards. Interatividade (cliques, animações) isolada em componentes filhos `'use client'` pequenos. |
| **Requisito Mínimo** | `curl https://avaliasolar.com.br` retorna HTML com nomes de categorias e empresas visíveis. |

#### Subtasks

- [ ] **4.1.1** Mapear todas as seções da landing e seus dados
- [ ] **4.1.2** Criar funções `async` server-side para fetch de dados:
  ```typescript
  async function getCategories() {
    const res = await fetch(`${API_URL}/api/v1/categories`, { next: { revalidate: 3600 } });
    return res.json();
  }
  ```
- [ ] **4.1.3** Converter `page.tsx` para async Server Component
- [ ] **4.1.4** Extrair interatividade (carrosséis, hover, cliques) para componentes `'use client'` filhos
- [ ] **4.1.5** Manter `Suspense` boundaries com fallback para loading
- [ ] **4.1.6** Testar: `curl https://avaliasolar.com.br | grep "Energia Solar"` retorna conteúdo
- [ ] **4.1.7** Testar: Google Rich Results Test com a URL da landing
- [ ] **4.1.8** Medir LCP antes/depois com Lighthouse

#### Critérios de Aceitação

- [x] `curl` da landing retorna HTML com conteúdo visível (empresas, categorias)
- [x] Lighthouse Performance score ≥ 70 mobile
- [x] FCP < 1.5s
- [x] LCP < 2.5s
- [x] Zero regressão visual (spot-check em 3 browsers)

---

### TASK 4.2 — Implementar ISR nas Páginas de Categorias

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-front/app/categories/[slug]/page.tsx` |
| **Esforço** | 1 dia |
| **Estado Atual** | `CategoryPageClientV2.tsx` usa `'use client'`. Toda renderização é client-side. Conteúdo não indexável sem JS. |
| **Estado Futuro** | Página de categoria renderizada no servidor com ISR (`revalidate: 3600`). HTML contém lista de empresas da categoria. Revalidação a cada 1 hora. |
| **Requisito Mínimo** | `curl https://avaliasolar.com.br/categories/energia-solar` retorna HTML com empresas |

#### Subtasks

- [ ] **4.2.1** Criar `page.tsx` Server Component que faz fetch server-side
- [ ] **4.2.2** Usar `revalidate: 3600` (1 hora)
- [ ] **4.2.3** Mover filtros interativos para componente `'use client'` filho
- [ ] **4.2.4** Implementar `generateStaticParams` para slugs conhecidos
- [ ] **4.2.5** Testar: `curl` retorna conteúdo
- [ ] **4.2.6** Validar: filtros funcionam normalmente

#### Critérios de Aceitação

- [x] HTML contém conteúdo da categoria
- [x] Filtros interativos funcionam
- [x] Página revalida a cada 1 hora
- [x] Sem aumento de TTFB (< 1s)

---

## FASE 5 — Qualidade e Estabilidade

> **Prazo**: 2-3 dias (gradual) | **Impacto**: Médio | **Risco**: Médio

---

### TASK 5.1 — Remover `ignoreBuildErrors` do Next.js

| Campo | Detalhe |
|---|---|
| **Arquivo** | `AB0-1-front/next.config.mjs` |
| **Esforço** | 2-3 dias (corrigir erros progressivamente) |
| **Estado Atual** | `typescript: { ignoreBuildErrors: true }` e `eslint: { ignoreDuringBuilds: true }`. Erros de tipo e lint não bloqueiam o build. Bugs podem chegar à produção silenciosamente. |
| **Estado Futuro** | Build falha se houver erros de TypeScript ou ESLint. Código que vai para produção é type-safe. |
| **Requisito Mínimo** | `npm run build` passa sem `ignoreBuildErrors` |

#### Subtasks

- [ ] **5.1.1** Remover `ignoreBuildErrors: true` do `next.config.mjs`
- [ ] **5.1.2** Rodar `npm run build` e coletar lista de erros
- [ ] **5.1.3** Classificar erros por severidade (type error vs any vs import)
- [ ] **5.1.4** Corrigir erros críticos (type errors que podem causar runtime bugs)
- [ ] **5.1.5** Corrigir erros de import
- [ ] **5.1.6** Para erros complexos, usar `// @ts-expect-error` com comentário justificando
- [ ] **5.1.7** Rodar `npm run build` final → deve passar limpo
- [ ] **5.1.8** Repetir para ESLint: remover `ignoreDuringBuilds: true`
- [ ] **5.1.9** Corrigir warnings de lint

#### Critérios de Aceitação

- [x] `npm run build` passa sem flags de ignorar erros
- [x] Zero `// @ts-ignore` sem comentário justificado
- [x] ESLint passa no build

---

### TASK 5.2 — Remover Índices Duplicados no PostgreSQL

| Campo | Detalhe |
|---|---|
| **Arquivo** | Nova migration |
| **Esforço** | 30 minutos |
| **Estado Atual** | `banners_categories` tem 2 índices idênticos (`idx_banners_categories_unique` e `index_banners_categories_unique`). `companies` tem 2 índices GIN em `services_offered`. Espaço desperdiçado + overhead de write. |
| **Estado Futuro** | Cada coluna/combinação tem no máximo 1 índice. |
| **Requisito Mínimo** | Nenhum índice duplicado |

#### Subtasks

- [ ] **5.2.1** Criar migration: `rails g migration RemoveDuplicateIndexes`
- [ ] **5.2.2** Remover índice duplicado de `banners_categories`
- [ ] **5.2.3** Remover índice GIN duplicado de `companies.services_offered`
- [ ] **5.2.4** Testar migration em development
- [ ] **5.2.5** Deploy com migration

#### Critérios de Aceitação

- [x] `\di+` no psql mostra zero índices duplicados
- [x] Todas queries continuam usando índices (EXPLAIN ANALYZE em queries críticas)

---

## FASE 6 — Observabilidade (Gratuita)

> **Prazo**: 1 dia | **Impacto**: Médio | **Risco**: Baixo

---

### TASK 6.1 — Configurar Alertas no Sentry

| Campo | Detalhe |
|---|---|
| **Plataforma** | sentry.io (free tier) |
| **Esforço** | 1 hora |
| **Estado Atual** | Sentry instalado mas alertas podem não estar configurados. Erros podem acontecer sem ninguém saber. |
| **Estado Futuro** | Alertas configurados para: erros novos, spike de erros, erros de API 5xx. Notificação via email ou Slack/Discord. |
| **Requisito Mínimo** | Receber notificação em < 5 min quando ocorre um erro novo em produção |

#### Subtasks

- [ ] **6.1.1** Acessar dashboard Sentry do projeto
- [ ] **6.1.2** Configurar alerta "New Issue" → email/Slack
- [ ] **6.1.3** Configurar alerta "Error Spike" (> 10 erros em 1h)
- [ ] **6.1.4** Configurar alerta "High Volume Transaction" para endpoints lentos
- [ ] **6.1.5** Testar: criar erro proposital em staging, verificar notificação

---

### TASK 6.2 — Configurar Uptime Monitoring (Gratuito)

| Campo | Detalhe |
|---|---|
| **Plataforma** | UptimeRobot (free tier: 50 monitors, 5min interval) |
| **Esforço** | 30 minutos |
| **Estado Atual** | Sem monitoramento de uptime. VM pode cair sem ninguém saber. |
| **Estado Futuro** | Monitoramento de `https://avaliasolar.com.br` e `https://api.avaliasolar.com.br` a cada 5 minutos com alerta por email. |
| **Requisito Mínimo** | Receber email se site ficar fora do ar por > 5 minutos |

#### Subtasks

- [ ] **6.2.1** Criar conta gratuita no UptimeRobot
- [ ] **6.2.2** Adicionar monitor HTTP: `https://avaliasolar.com.br` (check a cada 5 min)
- [ ] **6.2.3** Adicionar monitor HTTP: `https://api.avaliasolar.com.br/api/v1/health` (ou endpoint similar)
- [ ] **6.2.4** Configurar alerta por email
- [ ] **6.2.5** Testar: verificar que status page mostra "UP"

---

## Cronograma Resumido

```
┌──────────────────────────────────────────────────────────────────┐
│  SEMANA 1                                                        │
│                                                                  │
│  Dia 1 ── FASE 1: Nginx (gzip + HTTP/2 + cache) + Puma         │
│  Dia 2 ── FASE 2: Imagens (WebP + duplicatas + textura)         │
│  Dia 3 ── FASE 3: Backend (ListSerializer + table_exists)       │
│  Dia 4 ── FASE 3: Backend (ETag + lazy load libs)               │
│  Dia 5 ── FASE 6: Observabilidade (Sentry alertas + Uptime)     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  SEMANA 2                                                        │
│                                                                  │
│  Dia 6-8  ── FASE 4: Landing SSR + Categorias ISR              │
│  Dia 9-10 ── FASE 5: Remover ignoreBuildErrors + índices        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  PÓS-EXECUÇÃO                                                   │
│                                                                  │
│  ► Medir Core Web Vitals com PageSpeed Insights                 │
│  ► Medir Lighthouse CI (mobile + desktop)                       │
│  ► Reauditoria: verificar nota ≥ 7.5/10                        │
│  ► Documentar resultados no docs/resultados-otimizacao.md       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Validação Final

### Infraestrutura

- [ ] Nginx com gzip ativo
- [ ] Nginx com HTTP/2 ativo
- [ ] Cache headers em assets estáticos
- [ ] Puma em clustered mode

### Imagens

- [ ] Zero PNGs > 1MB no `public/`
- [ ] Textura < 200KB (WebP)
- [ ] Textura desabilitada em mobile
- [ ] Hero com `next/image priority`
- [ ] Zero duplicatas

### Backend

- [ ] CompanyListSerializer para listagens
- [ ] Zero `table_exists?` em requests
- [ ] ETag/304 em endpoints públicos
- [ ] Recharts/Leaflet em chunks separados

### Frontend / SEO

- [ ] Landing retorna HTML com conteúdo (SSR)
- [ ] Categorias com ISR (revalidate: 3600)
- [ ] `ignoreBuildErrors` removido
- [ ] Build passa limpo

### Banco

- [ ] Índices duplicados removidos

### Observabilidade

- [ ] Sentry com alertas configurados
- [ ] Uptime monitoring ativo

### Métricas Finais

- [ ] Lighthouse mobile ≥ 75
- [ ] LCP < 2.5s
- [ ] Payload landing < 2MB
- [ ] `ab -c 20` sem timeouts
- [ ] Score auditoria ≥ 7.5/10
