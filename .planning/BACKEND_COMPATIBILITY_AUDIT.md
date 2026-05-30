# BACKEND COMPATIBILITY AUDIT — Garantia de Risco Zero

Este documento apresenta a análise de conformidade do backend Rails, do Stripe Billing e do Active Admin, estabelecendo as diretrizes técnicas necessárias para garantir que a refatoração visual da página de perfil de empresa seja **100% segura, incremental e sem efeitos colaterais**.

---

## 1. Mapeamento de Integrações Sensíveis

### 1.1 Stripe & Faturamento (Billing)
O faturamento é orquestrado no Rails e integrado ao Stripe Checkout. O portal B2B consome as assinaturas por meio do model `Billing::CompanySubscription`.
- **Regra de Ouro:** Não alteraremos nenhuma coluna na tabela `billing_company_subscriptions`, `plans` ou nos IDs de preços cadastrados. Os caminhos de checkout mensais/anuais dos planos **Essential** e **Pro** permanecem intocados e operacionais no ambiente real do Stripe.

### 1.2 Active Admin
O Active Admin gerencia o catálogo de planos e a atribuição de banners e limites.
- **Regra de Ouro:** O painel continuará interagindo normalmente com a tabela `plans`. As colunas `features_json` que guardam os overrides dos planos e entitlements de empresas específicas não sofrerão nenhuma mudança estrutural de esquema.

### 1.3 URLs Públicas e Rotas Indexadas
O portal possui milhares de URLs de perfil de empresa indexadas no Google seguindo o formato `/companies/[slug]` ou `/companies/[id]`.
- **Regra de Ouro:** A estrutura de rotas do Next.js continuará capturando exatamente o mesmo parâmetro `[id]` que atua tanto para ID numérico quanto para slug textual, chamando o endpoint `/api/v1/companies/by_slug/:slug` ou `/api/v1/companies/:id` no backend. Nenhuma URL pública será quebrada ou redirecionada indevidamente, preservando o SEO orgânico.

---

## 2. Ponto Chave: Compatibilidade de Entitlements no Frontend

Qualquer recurso Premium (como CTAs customizados, tabela de preços, galeria de mídia e FAQ) que for renderizado na tela Next.js deverá consultar a chave canonizada do `feature_access` recebido no payload JSON:

```typescript
// Exemplo canônico de consumo seguro no frontend Next.js:
const showFaq = isFeatureEnabled(company.feature_access, 'faq_block');
const customCtas = isFeatureEnabled(company.feature_access, 'custom_ctas');
```

Isso garante que, mesmo se o backend retornar dados em planos Free ou Essential que não permitam esses recursos, o frontend os ocultará de forma inteligente, renderizando fallbacks visuais premium ou sugerindo upgrades não intrusivos.
