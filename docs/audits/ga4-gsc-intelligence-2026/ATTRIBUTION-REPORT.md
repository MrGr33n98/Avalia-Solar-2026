# Attribution Report — Avalia Solar 2026
**Auditoria de Modelagem de Atribuição, UTMs e Integridade de Canais**  
**Data:** 26 de Novembro de 2026  

---

## 1. O Problema Crítico da Falsa Atribuição de Referência

A auditoria de fontes/mídias nos últimos 28 dias revelou que **52% de todas as sessões de referência são geradas por fluxos de autenticação do próprio usuário**:

```
[ Visitante chega via Google Orgânico / Busca Solar ]
                       │
                       ▼
         [ Navega em avaliasolar.com.br ] (Atribuição: google / organic)
                       │
                       ▼
       [ Clica em "Entrar com Google" ]
                       │
                       ▼
       [ Redireciona para accounts.google.com ]
                       │
                       ▼
       [ Retorna para avaliasolar.com.br/auth/callback ]
                       │
                       ▼
  ❌ O GA4 encerra a sessão anterior e abre nova sessão:
     Nova Origem: accounts.google.com / referral
     Atribuição original de "google / organic" é DESTRUÍDA.
```

### Dados Quantitativos (28 Dias):
* `accounts.google.com / referral`: **219 sessões** (43,4% do tráfego total de sessões).
* `accounts.zoho.com / referral`: **24 sessões** (4,8% do tráfego total).
* **Impacto Consolidado:** Quase metade das sessões ativas do marketplace são classificadas como "Referência de terceiros", impedindo saber se o usuário que se cadastrou ou gerou lead veio de SEO, Redes Sociais, Indicação ou Tráfego Direto.

---

## 2. Preservação de UTMs e Atribuição First-Touch / Last-Touch

* **Implementação no Frontend:**
  * Arquivo: `AB0-1-front/lib/analytics/utm.ts`
  * O código do Avalia Solar já implementa armazenamento local de UTMs via `localStorage` e cookies (`avaliasolar_attribution_v2`), persistindo `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` e `utm_content`.
* **Gap:**
  * Essa persistência local alimenta o payload enviado ao backend Rails durante o cadastro de empresas e envio de leads, mas **não sobrescreve a sessão do GA4**.
  * No GA4, o modelo de atribuição é orientado a eventos e baseado em dados (Data-Driven Attribution), mas depende das regras de sessão do navegador.

---

## 3. Plano de Correção Imediata

1. **Configuração de "List Unwanted Referrals" no GA4 (Ação no Admin):**
   * Adicionar as seguintes condições de correspondência exata ou contém:
     * `accounts.google.com`
     * `accounts.zoho.com`
     * `avaliasolar.com.br`
     * `app.avaliasolar.com.br`
     * `crm.avaliasolar.com.br`
   * **Resultado:** O GA4 ignorará o cabeçalho `Referrer` ao retornar dessas origens, mantendo a atribuição da sessão original (ex: Google Orgânico ou Campanha de Lançamento).
2. **Cross-Domain Linking Automático:**
   * Garantir que links entre `www.avaliasolar.com.br` e `app.avaliasolar.com.br` compartilhem o parâmetro `_gl` caso os cookies de domínio não estejam unificados sob `.avaliasolar.com.br`.
   * Como o código em `gtag.ts` já configura `cookie_domain: 'avaliasolar.com.br'`, os cookies `_ga` e `_ga_<ID>` já são compartilhados entre subdomínios, necessitando apenas da exclusão de referências internas.

