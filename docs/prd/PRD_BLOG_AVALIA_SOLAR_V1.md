# PRD — Blog Avalia Solar: Correção, Integridade e Crescimento

- **Versão:** 1.0
- **Data:** 04/08/2026
- **Status:** Proposto
- **Documento de Origem:** [Auditoria E2E do Blog (04/08/2026)](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/relatorios-diagnostico/AUDITORIA_BLOG_E2E_2026-08-04.md) — Nota atual: 54/100, Nível C
- **Stack:** Next.js (frontend) · Rails + ActiveAdmin (backend/CMS) · PostgreSQL

---

## 1. Contexto e Problema

O blog do **Avalia Solar** possui uma fundação técnica de SEO acima da média (SSR, canonical, sitemap, JSON-LD, ISR, analytics), mas a auditoria E2E em produção identificou **6 achados críticos (C1–C6)**, **12 maiores (M1–M12)** e **8 menores** que comprometem os três pilares fundamentais do produto:

1. **Confiança (Trust):** Exibição de métricas sem fonte auditável ("+50.000 leitores", "+15.000 orçamentos"), fluxo de newsletter estático/inerte sem cadastro e formulário de checklist com CTA inerte.
2. **Navegação (Discovery):** Todos os atalhos de categoria publicados retornam vazios devido a um descompasso no contrato (filtro por ID numérico esperado no Rails vs. slug textual enviado pelo Next.js).
3. **Segurança Editorial:** HTML rico renderizado no Next.js sem sanitização explícita (`dangerouslySetInnerHTML` sem allowlist) e conteúdo no banco com HTML duplamente escapado.

Para alcançar o padrão de qualidade **A++++**, o blog precisa evoluir a governança de conteúdo, desativar mocks ou substitutos fictícios e consolidar sua arquitetura de informação.

---

## 2. Objetivos e Métricas de Sucesso

### Objetivo de Negócio
Transformar o blog de um repositório técnico estático em um canal confiável de aquisição orgânica e conversão, alinhado ao posicionamento de marketplace e reviews reais do setor solar.

### Objetivo do Produto
Elevar a qualidade do blog do nível C (54/100) para o nível A, zerando os achados críticos e garantindo conformidade com as diretrizes de experiência e acessibilidade.

### KPIs e Métricas
| Métrica | Situação Atual (04/08/2026) | Meta |
| --- | --- | --- |
| Atalhos de categoria funcionais | 0% (todos quebrados) | 100% funcionais |
| Métricas promocionais sem fonte | 6 instâncias | 0 (removidas até integração real) |
| CTAs estáticos/simulados no ar | 2 (newsletter, checklist) | 0 (desativados ou persistidos) |
| HTML rico sanitizado (backend + frontend) | Não | Sim (allowlist ativa + testes de payload) |
| Artigos com autor real e serializado | 0 de 3 | 100% dos artigos publicados |
| Lighthouse Mobile (A11y + SEO + BP) | Não medido | Performance ≥ 90; Outros ≥ 95 |
| Core Web Vitals (p75) | Não medido | LCP < 2.5s; INP < 200ms; CLS < 0.1 |

---

## 3. Escopo

### Dentro do Escopo
- Correção de todos os achados da auditoria de acordo com a prioridade (P0 a P2).
- Garantia de integridade de dados: remoção de qualquer contador ou número inflado sem fonte explícita e auditável.
- Implementação de um preview fiel no ActiveAdmin para o editor de artigos.
- Quality gates integrados de pré-publicação de posts (validação real de SEO e legibilidade).
- Integração real de fluxo de newsletter com LGPD e double opt-in.
- Governança de CTAs (limitados por template para evitar poluição visual).

### Fora do Escopo
- Desenvolvimento da ferramenta de simulação de orçamento (o blog apenas direcionará para o fluxo de orçamentos existente).
- Área de login exclusiva para leitores do blog ou caixa de comentários no final dos artigos.
- Suporte a múltiplos idiomas (foco exclusivo em pt-BR).

---

## 4. Personas

- **Consumidor Pesquisando Solução Solar:** Necessita de guias técnicos, comparativos reais de equipamentos e preços de mercado, confiando no blog para educar sua decisão e fazer pedidos de propostas sem spam.
- **Editor / Redator de Conteúdo:** Deseja escrever com flexibilidade no Quill/ActiveAdmin, visualizar o artigo exatamente como será exibido no front-end e ter validação em tempo real das metas de SEO (limite de caracteres de metatags).
- **Equipe de Growth / SEO:** Exige URLs amigáveis, tags canônicas corretas para todas as listagens de busca/filtros, tempo de carregamento rápido e rastreamento completo de conversão pós-ações.

---

## 5. Requisitos Funcionais

### Prioridade P0 — Integridade & Correções de Rota (Bloqueantes)

#### RF-01 · Resolução e Unificação do Contrato de Categorias (C1)
- O Next.js enviará a tag `category` como string (slug).
- O Rails `Api::V1::ArticlesController` receberá esse parâmetro textual e fará a resolução interna do slug para a categoria ativa antes de aplicar o filtro na consulta SQL.
- Todos os links de atalhos e destaques no Hero do blog devem passar a listar os artigos corretos em vez de retornar estados vazios.

#### RF-02 · Remoção de Métricas sem Fonte (C2)
- Excluir de produção contadores estáticos e desprovidos de auditoria (ex.: "+1.200 empresas cadastradas", "+8.000 avaliações verificadas", "+50.000 leitores", "+15.000 orçamentos", "+1.000 downloads").
- Permitir exibição de métricas apenas quando integradas a endpoints reais que computem os dados das tabelas do marketplace com base em queries ativas.

#### RF-03 · Desativação de CTAs Simulados (C3, C4)
- O formulário de newsletter e o card de download de checklist serão desativados da interface pública até que suas respectivas APIs de persistência (ou redirecionamento real de assets) estejam funcionais.

#### RF-04 · Sanitização e Segurança de Conteúdo Rico (C5)
- Implementar sanitização rígida no backend (Rails) antes de persistir o corpo de artigos (usando Gems como `Sanitize` ou `Loofah`).
- Permitir somente tags estruturais seguras na allowlist: `p, h2, h3, h4, ul, ol, li, a, strong, em, blockquote, img, figure, figcaption, table, thead, tbody, tr, th, td, code, pre`.
- Adicionar validação de sanitização na renderização no Next.js (ex: `isomorphic-dompurify`).

#### RF-05 · Correção de HTML Duplamente Escapado (C6)
- Identificar e migrar artigos contendo tags escapadas (como `&lt;p&gt;` inseridos erroneamente no banco).
- A API do Rails deve entregar strings de HTML válidas e limpas, sem necessidade do hack runtime do frontend (`content-fixer.ts` vira apenas depurador ou validação passiva).

#### RF-06 · Obrigatoriedade de Autor e Assinatura Real (M2)
- O campo `author` (objeto contendo nome, bio, foto e links de redes sociais) passa a ser obrigatório no modelo `Article` para publicação.
- Remover fallbacks estáticos em Next.js; quando for um post corporativo institucional, serializar a entidade `Organization` com logo e dados reais.

---

### Prioridade P1 — Qualidade Editorial & Otimização SEO

#### RF-07 · Preview em Tempo Real no CMS (M11)
- Disponibilizar botão "Visualizar" no formulário de edição do ActiveAdmin.
- O botão abre uma aba no frontend (`/blog/preview?token=...`) que autentica a sessão do admin de forma segura e renderiza o artigo com o layout real do blog (mesmo em estado de `draft`), aplicando `noindex`.

#### RF-08 · Quality Gate do Editor (M10, M11)
- Validar as especificações de metatags antes de permitir publicação:
  - Título SEO entre 30 e 60 caracteres.
  - Meta Description entre 70 e 160 caracteres.
  - Imagem do Banner presente (mínimo 1200x630px para redes sociais).
  - Presença de pelo menos 1 heading H2 no corpo do artigo.

#### RF-09 · Open Graph e Twitter Cards Customizados da Listagem (M1)
- Configurar metatags de compartilhamento exclusivas para a listagem do `/blog`, removendo a herança direta dos metadados genéricos da Home Page do marketplace.

#### RF-10 · Endpoint de Categorias Editoriais (M4)
- Criar a rota `GET /api/v1/articles/categories` que retorna somente categorias ativas com pelo menos um artigo publicado, incluindo a respectiva contagem de artigos.
- O Hero e a Sidebar do blog devem consumir esse endpoint exclusivo para evitar a exibição de categorias vazias ou do marketplace geral sem contexto editorial.

#### RF-11 · Tratamento de Erros e Estados Incomuns (M5, M6)
- Se a chamada para a API falhar no frontend, exibir tela de erro amigável com retry (e logar o erro no Sentry), em vez de uma mensagem "Nenhum artigo encontrado".
- Garantir que URLs de paginação fora de escopo (ex.: `/blog?page=99` quando existe apenas 1 página) redirecionem para a página inicial ou retornem erro 404 coerente.

#### RF-12 · Deduplicação de Artigos em Destaque (M7)
- Artigos marcados como "Featured" na primeira página não devem ser repetidos na listagem cronológica ("Últimos Artigos") da mesma página.

#### RF-13 · Revalidação Eficiente de Cache (ISR)
- Ao atualizar ou publicar um post no ActiveAdmin, disparar uma chamada de revalidação on-demand para revalidar as tags de cache no Next.js (revalidar caminhos `/blog`, `/blog/[slug]` e categorias editoriais).

---

### Prioridade P2 — Experiência & Conversão (Growth)

#### RF-14 · Integração Real de Newsletter e Consentimento (RF-11)
- Implementar fluxo completo de subscrição de e-mail integrado à API do Rails.
- Adicionar consentimento explícito em conformidade com a LGPD (registro de data, IP e versão de política).
- Configurar envio automático de double opt-in para confirmação de e-mail antes da ativação do lead.

#### RF-15 · Governança de CTAs e Menos Fricção Visual (M12)
- Reorganizar a sidebar do artigo de modo que haja apenas um CTA primário focado na conversão (ex.: simular preço de painel) e no máximo um CTA secundário.
- Evitar sobreposição de banners flutuantes e modais que impactam a leitura no mobile.

#### RF-16 · Tags e Relacionados (M3)
- Implementar taxonomia de tags nos artigos.
- Renderizar recomendações de artigos relacionados no rodapé de cada postagem com base em tags e categorias em comum.

---

## 6. Requisitos Não Funcionais

- **Segurança:** Proteção contra stored XSS (RF-04), controle de rate limit no endpoint de newsletter, e tokens assinados temporários para links de preview de artigos.
- **Performance (Core Web Vitals):** 
  - LCP p75 < 2.5s (imagem em destaque do artigo com propriedade `priority` no Next.js).
  - INP p75 < 200ms e CLS p75 < 0.1.
  - Banir o uso de GIFs animados em banners ou OG images.
- **Acessibilidade:** Compatibilidade com WCAG 2.2 nível AA (contraste de botões, tags semânticas, aria-current no filtro selecionado, navegação total por teclado).
- **SEO & Validação estruturada:** Zero erros de validação nas ferramentas Google Rich Results (schemas de FAQPage, BlogPosting e BreadcrumbList sem campos obrigatórios ausentes).

---

## 7. Critérios de Aceite (Definition of Done)

Para considerar cada requisito finalizado, a implementação deve atender a:
1. Cobertura de testes unitários (RSpec e Jest) superior a 80%.
2. Playwright E2E verificado localmente para fluxos principais (busca, paginação, atalhos de categoria, newsletter e artigo).
3. Auditoria do Axe-core executada nas páginas de listagem e artigo sem violações críticas de acessibilidade.
4. Código validado via RuboCop e ESLint de acordo com os guias de estilo locais.
5. Validação de dados estruturados com sucesso no Schema Validator.

---

## 8. Plano de Releases

- **Release R1 — Integridade e Correções (P0):** Correção dos fluxos de filtragem de categoria, remoção de todas as métricas fictícias e handlers inertes, normalização de HTML e implementação de sanitização.
- **Release R2 — SEO & Fluxo Editorial (P1):** Ativação de preview real, quality gate de publicação, metatags exclusivas do blog e do sitemap, e endpoint de categorias editoriais exclusivas.
- **Release R3 — Conversão e Experiência (P2):** Integração final do formulário real de newsletter, otimização visual de CTAs e governança de modais para mobile, implementação de tags e FAQPage por artigo.
