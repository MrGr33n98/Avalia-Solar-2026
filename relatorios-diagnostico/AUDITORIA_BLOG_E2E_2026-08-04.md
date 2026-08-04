<!-- Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V4 -->

# Auditoria E2E do Blog — Avalia Solar

**Data:** 4 de agosto de 2026  
**Ambiente:** produção  
**Escopo público:** https://www.avaliasolar.com.br/blog  
**Escopo editorial:** https://api.avaliasolar.com.br/admin/articles  
**Método:** inspeção HTTP/HTML, API pública, testes de navegação, frontend Next.js, backend Rails/ActiveAdmin e auditoria Hallmark.

## Resumo executivo

O blog tem uma fundação técnica acima da média: renderização no servidor, canonical, sitemap, robots, metatags por artigo, Open Graph, Twitter Card, BlogPosting, breadcrumbs estruturados, ISR, imagem prioritária, sumário e analytics.

Entretanto, o estado atual **não é A++++**. Há caminhos essenciais quebrados, conversões simuladas, métricas sem fonte e conteúdo editorial inconsistente.

**Nota geral atual: 54/100 — nível C.**

| Dimensão | Nota | Diagnóstico |
| --- | ---: | --- |
| Fluxo Admin → API → página | 6,5/10 | Funcional, sem preview/quality gate e com HTML inconsistente |
| Layout da listagem | 7/10 | Boa hierarquia; excesso de promoções e repetição |
| Layout do artigo | 7,5/10 | Boa leitura e TOC; sidebar/CTAs competem com conteúdo |
| Navegação e filtros | 3/10 | Atalhos principais de categorias quebrados |
| SEO técnico | 8/10 | Base forte; OG do índice e estados filtrados precisam revisão |
| Conteúdo/E-E-A-T | 5/10 | Só 3 artigos; autoria preenchida por fallback |
| Integridade dos dados | 2/10 | Métricas hardcoded e fallbacks fictícios |
| Conversão | 4/10 | Newsletter e checklist não concluem a ação |
| Segurança editorial | 4/10 | HTML sem sanitização explícita |
| Observabilidade | 8/10 | Leitura, progresso, intenção, cliques e compartilhamento |

### Veredito

O blog está indexável e utilizável, mas não é premium enquanto:

1. filtros por categoria estiverem quebrados;
2. números não auditados forem apresentados como fatos;
3. newsletter e checklist simularem ações sem persistência;
4. autoria e conteúdo dependerem de fallbacks;
5. HTML editorial não for sanitizado e validado.

## Fluxo atual ponta a ponta

```text
ActiveAdmin /admin/articles
  → Quill + banner + categoria + status + SEO
  → model Article
  → API /api/v1/articles
  → Next.js /blog
  → cards /blog/[slug]
  → metatags + JSON-LD
  → conteúdo + TOC + conversão + analytics
```

### Comprovado em produção

- /blog: HTTP 200, HTML SSR com aproximadamente 257 KB.
- Artigo real: HTTP 200, HTML SSR com aproximadamente 198 KB.
- Slug inexistente: HTTP 404.
- Admin sem sessão: redireciona para /admin/login.
- Login do Admin: X-Robots-Tag noindex, nofollow, noarchive.
- robots.txt aponta para o sitemap.
- Sitemap contém a listagem e os 3 artigos publicados.
- API pública contém 3 artigos, todos publicados e destacados.
- Tempo HTTP observado: listagem entre 1,2 e 2,6 s; artigo em 1,6 s. Não substitui Core Web Vitals.

### Limitação

O ActiveAdmin interno exige autenticação; formulário e regras foram auditados no código. A captura visual automatizada não foi concluída porque o Playwright local não tem browsers instalados e o Firefox headless falhou no compositor. Layout foi avaliado pelo HTML publicado, componentes e estilos.

## Achados críticos

### C1. Atalhos de categoria publicados estão quebrados

**Tell:** contrato de navegação divergente.  
**Onde:** BlogHero.tsx:55; CategoryHighlights.tsx:7-14; lib/api/blog.ts:24-31; articles_controller.rb:14-17.

Hero e destaques enviam slugs, mas o frontend os repassa como category_id e o Rails filtra por ID numérico.

| URL | Resultado |
| --- | --- |
| /blog?category=guias | 200, “Nenhum artigo encontrado” |
| /blog?category=financiamento-energia-solar | 200, vazio |
| /blog?category=energia-solar-residencial | 200, vazio |
| /blog?category=mobilidade-eletrica | 200, vazio |
| /blog?category=78 | funciona |

**Impacto:** descoberta, SEO interno, confiança e conversão.  
**Correção:** contrato único. Preferir category_slug resolvido no backend ou gerar atalhos reais com IDs.

### C2. Métricas promocionais sem fonte

**Tell Hallmark:** invented metrics.  
**Onde:** BlogHero.tsx:7-11; BlogSidebar.tsx:91-105; ChecklistCard.tsx:46-48.

- +1.200 empresas cadastradas
- +8.000 avaliações verificadas
- +50.000 leitores mensais
- +15.000 orçamentos realizados
- 50.000+ leitores
- Mais de 1.000 downloads este mês

Não existe consulta, fonte, período ou vínculo com analytics.

**Correção:** endpoint/warehouse auditável com período e fonte; até lá, remover números.

### C3. Newsletter não cadastra o e-mail

**Onde:** BlogSidebar.tsx:96-122; PostSidebar.tsx:55-72; NewsletterPopup.tsx:69-77.

- Formulários laterais não têm handler ou integração.
- Popup apenas registra evento, fecha e limpa o campo.
- Nenhuma chamada persiste a inscrição.

**Correção:** endpoint real, consentimento/LGPD, loading/success/error, double opt-in e evento após sucesso.

### C4. Checklist placeholder e CTA inerte

**Onde:** ChecklistCard.tsx:19-48; lib/api/blog.ts:94-101.

- Imagem comentada como Placeholder.
- Botão sem link ou handler.
- fetchChecklist retorna download_url '#'.
- Contagem de downloads hardcoded.

**Correção:** remover até existir ou conectar a asset/landing real.

### C5. HTML editorial sem sanitização explícita

**Onde:** app/blog/[slug]/page.tsx:301-314; lib/content-fixer.ts:1-39; app/admin/articles.rb:60-62.

O artigo usa dangerouslySetInnerHTML. O fixer apenas desescapa entidades e troca termos; não remove scripts, handlers, javascript: ou embeds. O Admin também usa raw.

**Risco:** stored XSS após conta comprometida, importação ou endpoint indevido.  
**Correção:** sanitização allowlist no backend e na renderização; testes com script, onerror, javascript: e SVG.

### C6. Artigo publicado com HTML duplamente escapado

O artigo ID 4 começa na API com `<p>&lt;p class="lead"&gt;...`. O frontend tenta reparar isso na leitura.

**Impacto:** HTML inválido, TOC instável, diferença entre preview/crawler/navegador.  
**Correção:** migrar conteúdo, normalizar no save e criar preview idêntico ao frontend.

## Achados maiores

### M1. Open Graph da listagem é herdado da home

O title/description são do blog, mas og:title, og:description e og:url descrevem a home.

**Correção:** OG/Twitter específicos para /blog e imagem editorial própria.

### M2. Autoria real ausente e identidade inconsistente

Os 3 artigos retornam author_name null. Metadata usa “Avalia Solar”; página e JSON-LD usam “Felipe Morais” e foto fixa.

**Correção:** autor obrigatório, serializado com bio/URL/foto; Organization somente para autoria institucional real.

### M3. Não há tags editoriais

Existe categoria única e seo_keywords, mas não taxonomia de tags navegável. Meta keywords não substitui tags.

### M4. Filtro usa categorias gerais do marketplace

**Onde:** lib/api/blog.ts:72-88; PostSidebar.tsx:75-99.

Busca até 200 categorias, muitas sem artigos, gerando ruído e vazios.

**Correção:** endpoint /articles/categories somente com categorias publicadas, contagem e slug.

### M5. Falha de API vira “nenhum artigo”

**Onde:** lib/api/blog.ts:23-52,72-91.

Erros retornam arrays vazios. Incidente parece ausência de conteúdo.

**Correção:** erro distinto, retry e observabilidade; não cachear falha como vazio.

### M6. Página fora do intervalo retorna 200

/blog?page=2 retorna 200 vazio, embora exista só uma página.

**Correção:** redirecionar/normalizar ou retornar 404.

### M7. Os mesmos 3 artigos aparecem duas vezes

Todos são featured e reaparecem em “Últimos Artigos”.

**Correção:** excluir destacados da grade inicial ou simplificar destaque.

### M8. Baixa profundidade editorial

Há apenas 3 artigos para um hub amplo. Isso reduz cobertura semântica, relacionados, links internos e autoridade temática.

### M9. FAQ schema sem fluxo editorial

O frontend aceita article.faqs, mas model, serializer e formulário auditados não oferecem edição.

### M10. Limites SEO são apenas hints

**Onde:** app/admin/articles.rb:115-129.

Não há contador, preview SERP ou validação real de 60/160 caracteres.

### M11. Admin sem preview e quality gate

Não há preview frontend, validação de headings/links, imagem social, canonical, autor ou legibilidade antes de publicar.

### M12. CTAs excessivos

Hero, simulador, WhatsApp, newsletter, empresas, checklist, banner, sticky mobile, popup, share bar e conversão competem entre si.

**Tell Hallmark:** card stack / conversion overload.  
**Correção:** um CTA primário e no máximo um secundário por template.

## Achados menores

1. Hero com faixa genérica de 3 estatísticas.
2. Listagem minimalista versus artigo cheio de cards, gradientes e sombras.
3. Sidebars diferentes para as mesmas funções.
4. Estado ativo das categorias pouco evidente.
5. Meta keywords genéricas sem ganho relevante.
6. Admin recomenda 1200×630, mas valida só 200×200.
7. GIF aceito para banner/LCP/OG.
8. Cache precisa revalidação por tag ao publicar.

## SEO técnico

### Aprovado

- SSR e conteúdo no HTML.
- Title/description específicos no artigo.
- Canonical absoluto.
- Robots e Googlebot adequados.
- OG article, data, autor e imagem.
- Twitter summary_large_image.
- JSON-LD Organization, WebSite, Blog/BlogPosting e breadcrumb.
- Sitemap completo para o estado atual.
- 404 real.
- Imagem principal prioritária.
- Admin protegido e noindex.

### Lacunas

- OG/Twitter da listagem herdados da home.
- Blog JSON-LD pode incluir URL, @id e blogPost.
- BlogPosting deve ligar entidades por @id e incluir URL/articleSection quando real.
- Autoria inconsistente prejudica E-E-A-T.
- Sem tags.
- Busca/filtro/paginação têm metadata estática.
- HTML reparado em runtime prejudica semântica.

## Inventário de mocks e hardcodes

| Item | Estado | Local |
| --- | --- | --- |
| Estatísticas do hero | Hardcoded | BlogHero.tsx:7-11 |
| 15.000 orçamentos | Hardcoded | BlogSidebar.tsx:91-93 |
| 50.000+ leitores | Hardcoded | BlogSidebar.tsx:104-106 |
| Newsletter lateral | Sem integração | BlogSidebar.tsx:110-119 |
| Newsletter do artigo | Sem integração | PostSidebar.tsx:55-72 |
| Newsletter popup | Não persiste | NewsletterPopup.tsx:69-77 |
| Checklist | Placeholder/inerte | ChecklistCard.tsx:19-48 |
| 1.000 downloads | Hardcoded | ChecklistCard.tsx:46-48 |
| fetchChecklist | Mock com URL # | lib/api/blog.ts:94-101 |
| Empresas verificadas | Fallback fictício | lib/api/blog.ts:104-118 |
| Autor Felipe Morais | Fallback | app/blog/[slug]/page.tsx:142-148 |
| Categorias em destaque | Lista manual | CategoryHighlights.tsx:7-14 |

**Regra:** produção nunca deve substituir falha por entidades fictícias. Omitir o bloco ou mostrar indisponibilidade.

## Auditoria Hallmark

### Críticos

1. Invented metrics.
2. Broken information architecture.
3. Fake interaction.
4. Unsafe rich content boundary.
5. Card stack / conversion overload.

### Maiores

1. Repetição estrutural.
2. 3-column stat strip.
3. Drift do sistema visual.
4. Sticky CTA + popup podem bloquear leitura mobile.
5. Baixa especificidade e volume de conteúdo.

### Menores

1. Estado ativo fraco.
2. Sidebars duplicadas.
3. Raios/sombras/containment inconsistentes.
4. Voz de CTA inconsistente.

**Contagem Hallmark:** 5 críticos · 5 maiores · 4 menores.

## Plano para chegar ao nível A

### P0 — antes de campanhas

1. Corrigir categorias e adicionar E2E.
2. Desativar newsletter/checklist até existir backend.
3. Remover métricas hardcoded.
4. Sanitizar HTML e migrar conteúdo escapado.
5. Tornar autor obrigatório.

### P1 — qualidade editorial e SEO

1. Preview real no Admin.
2. Quality gate de título, description, canonical, imagem, autor, headings e links.
3. OG/Twitter próprios da listagem.
4. Endpoint de categorias editoriais.
5. Estados separados de erro/vazio/loading.
6. Revalidação por tag.
7. Normalizar paginação inválida.

### P2 — experiência e crescimento

1. Consolidar design system.
2. Um CTA primário por template.
3. Newsletter real com consentimento e double opt-in.
4. Calendário e clusters editoriais.
5. Relacionados por intenção/tags.
6. Core Web Vitals e acessibilidade em browser real.

## Critérios de aceite A++++

- Todos os links principais com E2E verde.
- Nenhuma métrica sem fonte.
- Nenhum CTA simula sucesso.
- HTML rico sanitizado.
- Artigos com autor real, data, categoria, imagem e metadata.
- WCAG AA.
- Lighthouse mobile: Performance ≥ 90; Accessibility/Best Practices/SEO ≥ 95.
- LCP p75 < 2,5 s; INP p75 < 200 ms; CLS p75 < 0,1.
- Rich Results e Schema Validator sem erros.
- Sitemap, canonical e HTTP coerentes.
- Preview e checklist editorial obrigatórios.
- Zero mocks/fallbacks fictícios em produção.
- Testes de busca, categoria, ordenação, paginação, artigo, 404, newsletter e publicação.

## Matriz mínima de testes

| Camada | Caso |
| --- | --- |
| Rails request | somente publicados e data válida |
| Rails request | filtro de categoria |
| Rails request | busca, sort e paginação |
| Rails request | draft/futuro não vaza |
| Rails security | sanitizer remove payloads |
| Admin system | draft → preview → published |
| Next unit | erro não vira vazio |
| Next metadata | OG/canonical |
| Playwright | atalhos de categoria retornam cards |
| Playwright | busca com/sem resultado |
| Playwright | artigo, TOC e 404 |
| Playwright | newsletter real |
| Playwright mobile | 320, 375, 414 e 768 px |
| Axe | listagem, artigo, modal e sticky CTA |

## Conclusão

A base de SEO e renderização é sólida, mas a confiança é enfraquecida por navegação quebrada, números não verificáveis e interações falsas. O caminho mais rápido para nível A não é adicionar blocos: é **corrigir contratos, remover simulações, garantir integridade editorial e reduzir competição de CTAs**.
