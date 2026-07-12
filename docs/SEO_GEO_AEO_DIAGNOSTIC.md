# Diagnóstico SEO + GEO + AEO — AvaliaSolar.com.br

Este documento contém o diagnóstico de SEO, GEO e AEO realizado em 12/07/2026.

## 1. Visão Geral da Plataforma

| Indicador | Valor |
|-----------|-------|
| **Segmento** | Marketplace de comparação de empresas de energia solar e mobilidade elétrica |
| **Tecnologia** | Next.js (SSR) |
| **Empresas cadastradas** | 420+ listadas / 1.200+ (claim do blog) |
| **Avaliações verificadas** | 8.000+ |
| **URLs no sitemap** | 2.208 |
| **Artigos de blog** | **Apenas 3** |
| **Redes sociais** | Instagram, LinkedIn |

---

## 2. Diagnóstico SEO — Nota: C+ (6,5/10)

### ✅ Pontos Fortes

| Elemento | Status | Observação |
|----------|--------|------------|
| Schema Markup | ✅ Excelente | Organization, WebSite, BreadcrumbList, FAQPage, BlogPosting |
| Sitemap.xml | ✅ Bom | 2.208 URLs com lastmod, priority e changefreq |
| Robots.txt | ✅ Adequado | Bloqueia áreas privadas, aponta sitemap |
| Open Graph / Twitter Cards | ✅ Implementado | Tags completas para compartilhamento social |
| H1 | ✅ Único e relevante | "Encontre empresas solares confiáveis na sua região" |
| FAQ Section + Schema | ✅ Presente | 5 perguntas na homepage |
| Navegação | ✅ Clara | Estrutura lógica com filtros por estado e categoria |
| LGPD | ✅ Cookie consent | Banner de consentimento configurado |

### ❌ Pontos Críticos

| Problema | Severidade | Impacto |
|----------|------------|---------|
| **Blog com apenas 3 artigos** | 🔴 Alto | Autoridade de domínio severamente limitada |
| **Artigos muito curtos (~300 palavras)** | 🔴 Alto | Conteúdo insuficiente para ranquear |
| **Canonical errado no blog** | 🔴 **Crítico** | Páginas de post canonicalizam para homepage (!) |
| **Meta descriptions genéricas** | 🟡 Médio | Mesma description repetida em múltiplas páginas |
| **Páginas de empresa com 404** | 🔴 Alto | Ex: `/companies/voltalia` retorna erro |
| **Sem Review schema** | 🟡 Médio | Perde rich snippets de avaliações no Google |
| **Artigos sem imagens** | 🟡 Médio | Zero imagens no artigo analisado |
| **Sem breadcrumbs visuais** | 🟢 Baixo | Schema existe mas não hay navegação visual |

---

## 3. Diagnóstico GEO — Nota: D (3/10)

O **GEO (Generative Engine Optimization)** mede quão citável sua marca é por IAs como ChatGPT, Perplexity, Gemini e Claude. Em 2026, **63% dos sites relatam tráfego vindo de buscas por IA** e **64% dos consumidores estão prontos para comprar produtos sugeridos por IA**.

### ✅ Pontos Positivos
- Schema Organization com `sameAs` para redes sociais
- Estrutura de dados limpa e semanticamente correta
- FAQPage schema ajuda em respostas de IA

### ❌ Pontos Críticos

| Problema | Severidade | Detalhe |
|----------|------------|---------|
| **Quase zero menções na web** | 🔴 Crítico | Busca por "Avalia Solar" retorna apenas 2 resultados relevantes |
| **Sem presença em comunidades** | 🔴 Alto | Zero participação em Reddit, fóruns ou grupos do nicho |
| **Sem conteúdo em terceiros** | 🔴 Alto | Nenhum artigo guest post, podcast ou entrevista |
| **Sem Wikipedia** | 🟡 Médio | Marca ainda não atende notabilidade, mas deve ser meta |
| **Sem dados originais citáveis** | 🔴 Alto | Nenhuma pesquisa, estatística ou relatório próprio |
| **Redes sociais limitadas** | 🟡 Médio | Apenas Instagram + LinkedIn |
| **Conteúdo insuficiente para embeddings** | 🔴 Alto | IA não tem material suficiente para "aprender" sobre a marca |

---

## 4. Diagnóstico AEO — Nota: C (5/10)

O **AEO (Answer Engine Optimization)** foca em aparecer como resposta direta em featured snippets, People Also Ask, Google AI Overviews e assistentes de voz.

### ✅ Pontos Positivos
- FAQ com 5 perguntas na homepage
- FAQPage Schema implementado corretamente
- Blog com estrutura de artigos

### ❌ Pontos Críticos

| Problema | Severidade | Detalhe |
|----------|------------|---------|
| **Apenas 5 FAQs** | 🔴 Alto | Ideal: 20-30 perguntas cobrindo todo funil |
| **Artigos sem formato de resposta direta** | 🔴 Alto | Não seguem padrão "resposta em 40-60 palavras + detalhes" |
| **Sem Speakable schema** | 🟡 Médio | Invisível para assistentes de voz |
| **Sem HowTo schema** | 🟡 Médio | Perde oportunidade em guias passo a passo |
| **Blog não cobre PAA** | 🔴 Alto | Não responde "People Also Ask" do setor solar |
| **Sem featured snippets otimizados** | 🟡 Médio | Tabelas, listas e definições não estruturadas para IA |

---

## 5. Panorama Competitivo

| Concorrente | Tipo | Fortaleza |
|-------------|------|-----------|
| **Portal Solar** | Portal + notícias | Autoridade de domínio alta, conteúdo abundante |
| **Canal Solar** | Portal + notícias | Forte em SEO, backlinks de autoridade |
| **ecycle.com.br** | Educação + conteúdo | Boa autoridade, conteúdo evergreen |
| **WEG** | Fabricante | Marca forte, conteúdo técnico detalhado |
| **Órigo Energia** | Assinatura solar | Blog otimizado, captura intenção de busca |

> O mercado brasileiro de energia solar está em **66 GW** de capacidade instalada, com projeção de crescer **+22,9 GW até 2027** (ABSOLAR).

---

## 6. Plano de Ação Recomendado

### 🔥 Curto Prazo (0-3 meses) — Impacto Imediato

| # | Ação | Prioridade |
|---|------|------------|
| 1 | **Corrigir canonical tags** das páginas de blog para self-referencing | 🔴 Crítico |
| 2 | **Publicar 15-20 artigos** no blog (mín. 800 palavras cada) | 🔴 Crítico |
| 3 | **Adicionar imagens** otimizadas com alt text em todos os artigos | 🟡 Alta |
| 4 | **Expandir FAQ** para 20+ perguntas cobrindo todo o funil | 🟡 Alta |
| 5 | **Implementar Review/AggregateRating** schema nas páginas de empresa | 🟡 Alta |
| 6 | **Corrigir páginas 404** de perfis de empresas | 🔴 Crítico |

### ⚡ Médio Prazo (3-6 meses) — Construção de Autoridade

| # | Ação | Prioridade |
|---|------|------------|
| 7 | Criar **guias passo a passo** com HowTo schema | 🟡 Alta |
| 8 | Publicar **pesquisa/dados originais** do setor (citáveis por IA) | 🔴 Alta |
| 9 | Desenvolver presença em **Reddit e fóruns** do nicho solar | 🟡 Alta |
| 10 | Conseguir **menções em publicações** do setor (Portal Solar, Canal Solar) | 🟡 Alta |
| 11 | Criar/otimizar **Google Business Profile** | 🟢 Média |

### 🚀 Longo Prazo (6-12 meses) — Dominação de IA

| # | Ação | Prioridade |
|---|------|------------|
| 12 | Buscar **inclusão na Wikipedia** (quando atender notabilidade) | 🟢 Média |
| 13 | Desenvolver **conteúdo em vídeo** (YouTube) otimizado para GEO | 🟢 Média |
| 14 | Criar **parcerias de conteúdo** com fabricantes do setor | 🟢 Média |
| 15 | Implementar **Speakable schema** para voice search | 🟢 Média |
| 16 | Publicar **Relatório Anual do Setor Solar Brasileiro** | 🔴 Alta |

---

## 7. Resumo Executivo

| Dimensão | Nota | Status |
|----------|------|--------|
| **SEO Técnico** | C+ (6,5/10) | Estrutura boa, conteúdo insuficiente |
| **GEO** | D (3/10) | Marca praticamente invisível para IAs |
| **AEO** | C (5/10) | Base presente, precisa escalar |
