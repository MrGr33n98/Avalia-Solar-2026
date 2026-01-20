A seguir eu te entrego:

Análise objetiva do que melhorar (com base na imagem)

PROMPT abrangente para refatorar /blog integrando com Rails ActiveAdmin (backend) + shadcn/ui (sem quebrar estrutura)

Imagem de referência (já gerada) de como deve ficar

1) O que está “ruim” hoje na imagem (e o que vamos corrigir)
Problemas visuais / UX

Grid muito “alto” e repetitivo → cards iguais, pouca variação editorial.

“Sem imagem” quebra percepção premium → precisa fallback bonito (placeholder com blur + ícone + gradiente).

Filtros/categorias com pouca hierarquia → usuário não entende onde clicar primeiro.

Hero bom, mas poderia ter 2 CTAs claros + prova social (“+X guias, +Y empresas certificadas”).

Sidebar: itens bons, mas faltam:

sticky bem calibrado

copy persuasiva

CTA forte (orçamento / WhatsApp / checklist)

“empresas verificadas” com mini-cards de verdade (e skeletons decentes)

Falta bloco “Destaques / Editor’s pick / Trending” no topo (isso aumenta clique).

Problemas de dados / integração

Precisa ficar 100% alimentado pelo Rails (ActiveAdmin) via endpoints claros:

posts paginados, categorias, tags, featured, related etc.

2) PROMPT abrangente (copiar e colar no Trae/Cursor)

Cole isso inteiro no seu editor/IA para gerar o refactor completo.

PROMPT

Você é um engenheiro de software sênior especialista em Next.js (App Router), React, Tailwind e shadcn/ui, com foco em UI/UX premium e marketing de conversão para marketplace.
Projeto: Avalia Solar. Backend: Ruby on Rails com ActiveAdmin (blog gerenciado no admin). Front: Next.js.

Objetivo

Refatorar a página /blog (listagem principal) para ficar premium, com melhor uso de espaço, maior taxa de clique (CTR) e conversão, usando shadcn/ui e integrando com o backend Rails (ActiveAdmin) via API.

Entrada (o que já existe)

Existe uma pasta de componentes:

components/blog/BlogHero.tsx

components/blog/CategoryFilter.tsx

components/blog/CategoryHighlights.tsx

components/blog/ChecklistCard.tsx

components/blog/EnergyCalculator.tsx

components/blog/ShareButtons.tsx

components/blog/RelatedPostsGrid.tsx

components/blog/PostHeader.tsx

components/blog/PostSidebar.tsx

components/blog/PostTOC.tsx

components/blog/ReadingProgress.tsx

components/blog/StickyMobileCTA.tsx
…etc.

A página atual tem:

Hero grande

Categorias

Grid de posts com muitos cards “sem imagem”

Sidebar com: Simular orçamento, Empresas verificadas, Newsletter, Checklist popular

Regras obrigatórias

NÃO quebrar rotas existentes e não remover funcionalidades; apenas refatorar UI/UX e melhorar composição.

Usar shadcn/ui sempre que fizer sentido: Card, Button, Badge, Tabs, Separator, Skeleton, Tooltip, ScrollArea, Input, Select, Sheet, DropdownMenu.

Manter responsivo (mobile-first), acessível (aria-label, foco visível).

Manter performance: usar Server Components para fetch inicial e Client Components só para filtros interativos.

Dark mode deve ficar excelente.

Integração com Rails (ActiveAdmin)

Assumir que o Rails expõe endpoints JSON. Se não existirem, você deve especificar exatamente quais precisam ser criados (controllers/serializers) e quais campos devem retornar.

Endpoints necessários

GET /api/v1/blog/posts?page=&per_page=&q=&category=&tag=&sort=
Retorna:
{
data: [{ id, slug, title, excerpt, cover_image_url, category: {name, slug}, tags:[{name,slug}], author:{name, avatar_url}, reading_time, published_at }],
meta: { page, per_page, total, total_pages }
}

GET /api/v1/blog/featured
Retorna 3-6 posts “destaque” para o topo.

GET /api/v1/blog/categories
Retorna categorias com contagem:
[{ name, slug, count }]

GET /api/v1/blog/checklist_featured
Retorna um lead-magnet (título, descrição, imagem, url_download ou id).

(Opcional) GET /api/v1/companies/verified?state=&city=&limit=3
Retorna empresas verificadas para sidebar.

Padrão de cache

/blog deve usar ISR (revalidate) ou fetch com cache e revalidate: 60-300s.

Nova UX / Layout desejado (desktop)

Container max-w-7xl, grid 12 colunas:

Conteúdo principal: 8 colunas

Sidebar sticky: 4 colunas (top 96px)

Topo (/blog)

BlogHero premium:

Título + subtítulo

2 botões: “Ver guias” e “Receber orçamento”

Card do lado com “Anuncie aqui” ou “Empresas certificadas”

Chips de prova social (ex: “+1.200 empresas”, “Guias gratuitos”, “Cidades atendidas”)

CategoryHighlights (linha de cards compactos)

4 categorias principais com ícone e contagem

Bloco “Destaques” (Featured)

1 card grande (imagem, título, excerpt)

2 cards médios ao lado

Skeleton durante loading

Bloco “Últimos artigos”

Tabs (Tudo / Economia / Instalação / Manutenção / Financiamento)

Busca (Input com ícone)

Sort dropdown (Mais recentes / Mais populares)

Cards de posts

Sempre com imagem: se não tiver cover_image_url, usar fallback premium:
Card com gradiente suave + ícone + texto “Avalia Solar”

Badge de categoria

Meta compacta: data + tempo leitura

Linha “Ler artigo” com seta

Hover/Focus: elevação sutil, borda e shadow, sem exagero

Sidebar sticky (conversão)

Ordem:

QuoteCard (Simular orçamento)

Select Cidade/UF + botão primário “Receber orçamento”

Botão secundário WhatsApp

Microcopy persuasiva

VerifiedCompaniesMiniList

3 mini-cards com nome + estrelas + cidade

Skeleton se vazio

Link “Ver todas”

NewsletterCard

Input e-mail + botão “Receber guias”

Captura via POST /api/v1/leads

ChecklistCard (lead magnet)

imagem + bullets + botão “Baixar checklist”

tracking de clique

Mobile

Hero em coluna

Categorias em horizontal scroll

Sidebar vira “Cards empilhados” no meio do feed

Botão flutuante/StickyMobileCTA: “Orçamento” e “WhatsApp”

Filtros em Sheet (drawer)

Tracking e eventos (opcional mas recomendado)

Disparar eventos: blog_search, blog_filter, blog_open_post, blog_cta_quote, blog_cta_whatsapp, blog_lead_submit

Entrega

Refatorar a página /blog com composição premium, sem quebrar a estrutura.

Criar/ajustar componentes:

BlogIndexPage (server)

BlogIndexClient (client)

FeaturedPostsSection

PostCard (novo padrão)

BlogSidebar (atualizado)

BlogFiltersBar (tabs + busca + sort)

VerifiedCompaniesMiniList

Criar lib/api/blog.ts com funções:

fetchPosts, fetchFeatured, fetchCategories, fetchChecklist, fetchVerifiedCompanies

Listar exatamente o que precisa no Rails (controllers + serializers) caso não exista.

Gere o código completo.

3) Imagem de referência (como deve ficar)

A imagem de referência do /blog premium foi gerada. Se você quiser, eu faço variações:

mais “G2-like” (mais denso)

mais “Airbnb-like” (mais clean)

com bloco “Trending” + “Guias e Checklists” em destaque

Se quiser que eu ajuste pra ficar idêntico ao seu design system (cores exatas, espaçamentos, radius, sombra), me diga:

sua paleta principal (hex),

radius padrão,

e se você prefere cards com borda ou “flat”.