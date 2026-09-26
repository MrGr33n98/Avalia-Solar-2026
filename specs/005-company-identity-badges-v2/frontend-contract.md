# Contrato de Frontend (Next.js 14 & UI Components) — Spec 005

## 1. Princípios de Apresentação
1. **Zero Inferência Comercial:** Proibido usar `featured || has_paid_plan` ou `priority_score >= 100`. O frontend consome exclusivamente as chaves canônicas:
   - `company.identity.primary_category`
   - `company.identity.verification`
   - `company.commercial_status`
   - `company.distribution`
   - `company.recognitions`

---

## 2. Componentes de UI Padronizados

### 2.1 `PrimaryCategoryBadge`
- **Origem dos Dados:** `company.identity?.primary_category`.
- **Renderização:** Pill discreto e elegante (tom neutro/sutil, tipografia precisa).
- **Interação:** Link direto para `/categories/${primary_category.slug}`.
- **Acessibilidade:** `focus-visible:ring-2`, navegação por teclado (`Tab`/`Enter`), `title` e `aria-label`.
- **Comportamento quando nulo:** Não renderiza nada; nunca faz fallback para `categories[0]`.

### 2.2 `VerificationBadge`
- **Origem dos Dados:** `company.identity?.verification`.
- **Renderização:** Ícone `BadgeCheck` compacto em tom azul oficial Avalia Solar (independente de plano comercial).
- **Semântica:** Exibido APENAS quando `verification.status === 'verified'`.
- **Proibição:** Nunca exibe a palavra "Premium" ou "Pro" associada a este selo.

### 2.3 `CommercialPlanBadge`
- **Origem dos Dados:** `company.commercial_status?.tier`.
- **Variantes:**
  - `free` ➔ Não renderiza nenhum badge.
  - `pro` ➔ Badge compacto `PRO` (violeta/indigo sutil).
  - `enterprise` ➔ Badge compacto `ENTERPRISE` (ardósia escuro / titânio premium).
- **Isolamento:** Não é alterado por `featured` ou `sponsored`.

### 2.4 `CompanyAwardsCard`
- **Origem dos Dados:** `company.recognitions[]`.
- **Integração:** Inserido na aba de Visão Geral (`CompanyOverview.tsx`).
- **Comportamento:**
  - Exibe o selo principal com imagem oficial e headline.
  - Botão "Ver todos os prêmios" abre modal Radix Dialog com a lista completa de medalhas.
  - Cada selo contém link externo para a página de verificação oficial `/badges/${public_slug}`.
  - Estados de `loading` (Skeleton), `empty` (oculto quando vazio) e fallback de imagem com ícone de Troféu.

### 2.5 Reconhecimento na Logomarca (`CompanyLogo`)
- Renderiza no máximo UM selo de conquista flutuante no canto superior da logo (`badge.position`), sem encobrir a legibilidade da marca.

---

## 3. Página Pública de Verificação (`/badges/[slug]`)
- **Arquivo:** `AB0-1-front/app/badges/[slug]/page.tsx`.
- **Renderização:** Server Component (SSR / ISR) com revalidação sob demanda.
- **Contrato Visual:**
  - Selo oficial em alta resolução.
  - Emissor: Avalia Solar.
  - Ano, edição, categoria técnica e descrição oficial.
  - Grid de empresas que conquistaram o selo com links canônicos para seus perfis.
  - Selo inativo/inexistente: Dispara `notFound()` do Next.js (HTTP 404 real).
- **SEO / OpenGraph:**
  - `generateMetadata`: Título canônico `Selo Oficial ${badge.name} | Avalia Solar`, descrição, OpenGraph Image do selo.
  - JSON-LD estruturado: Esquema `WebPage` e `Organization`.
