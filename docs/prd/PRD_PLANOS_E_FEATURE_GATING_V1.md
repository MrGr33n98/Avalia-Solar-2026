# PRD: Planos, Feature Gating e Pricing Comercial

Data: 2026-03-12
Status: Proposed
Owner: Produto + Engenharia Plataforma

## 1. Problema

O produto já possui base técnica para planos, mas não possui um sistema coeso de monetização. Hoje:

- `Plan.features_json` existe, mas ainda não é o contrato dominante
- `Company` carrega flags legadas que misturam entitlement com operação
- o dashboard já usa `plan_features` em alguns módulos, mas de forma desigual
- o produto público ainda usa `active_admin` como proxy de plano pago em pontos críticos
- a página de pricing não existe de forma funcional, apesar de o app já apontar upgrade para `/pricing`

Resultado:

- difícil operar planos com segurança
- difícil vender com clareza
- difícil evoluir sem regressões

## 2. Objetivo do V1

Implantar um sistema de planos controlável, escalável e resiliente, com:

- uma fonte única de verdade para features pagas e gratuitas
- operação amigável pelo ActiveAdmin
- enforcement real no backend
- rendering consistente no dashboard e no perfil público
- página comercial de pricing pronta para conversão

## 3. Objetivos de negócio

- transformar o plano pago em uma oferta de valor clara
- reduzir vazamento para concorrentes no perfil pago
- tornar o upgrade visível dentro do dashboard
- permitir operação comercial sem editar JSON manualmente
- abrir caminho para tiers `Gratuito`, `Pro` e `Enterprise`

## 4. Objetivos de engenharia

- centralizar a resolução de acesso por feature
- remover dependência semântica de `active_admin` como gate comercial
- evitar regras divergentes entre API, dashboard e página pública
- suportar override por empresa sem perder governança
- criar base testável para evoluções futuras

## 5. Fora de escopo do V1

- billing/checkout automatizado
- provisioning automático após pagamento
- experimentação de pricing dinâmica por segmento

Observação:

- o V1 deve tratar prêmios e selos apenas como bloco genérico de prova social

## 6. Princípios do sistema

### 6.1 Fonte única de verdade

- `Plan.features_json` é a fonte canônica de entitlement
- `Company.plan_features` existe apenas para override excepcional e auditável

### 6.2 Backend decide, frontend apresenta

- o backend resolve acesso
- o frontend não inventa regra de negócio
- blur é UX de upsell, não segurança

### 6.3 Três estados por feature

Cada feature deve assumir exatamente um estado:

- `enabled`
- `locked`
- `hidden`

### 6.4 Catálogo explícito

Toda feature monetizável precisa ter:

- chave canônica
- descrição operacional
- comportamento esperado em cada plano

### 6.5 Compatibilidade controlada

Flags legadas podem existir temporariamente, mas apenas como alias migratório.

## 7. Modelo de planos do V1

### 7.1 Gratuito

Objetivo:

- presença básica no marketplace
- descoberta orgânica
- comparação aberta com concorrentes

Inclui:

- descrição básica
- área de funcionalidades
- links básicos da empresa
- presença no dashboard
- alternativas visíveis
- banners de concorrentes visíveis

### 7.2 Pro

Objetivo:

- transformar o perfil em vitrine comercial
- aumentar conversão
- remover distração competitiva

Inclui:

- CTAs personalizados
- pricing table
- oferta especial
- descrição patrocinada
- banner promocional
- mídia e materiais baixáveis
- FAQ premium
- destaque de avaliação
- analytics avançado
- supressão de alternativas
- supressão de banners de concorrentes

### 7.3 Enterprise

Objetivo:

- suportar empresas com operação comercial e analítica mais madura

Inclui tudo do Pro mais:

- leads avançados
- intent scores
- webhooks e integrações
- governança de múltiplos fluxos
- atendimento comercial consultivo

## 8. Catálogo canônico de features

```json
{
  "product_description": true,
  "product_features_block": true,
  "ideal_customer_block": false,
  "promo_banner": false,
  "verified_product": false,
  "highlight_badges": false,
  "custom_ctas": false,
  "pricing_table": false,
  "special_offer": false,
  "sponsored_description": false,
  "downloadable_materials": false,
  "media_gallery": false,
  "company_links_block": true,
  "forum_highlight": false,
  "featured_review": false,
  "faq_block": false,
  "advanced_analytics": false,
  "leads_marketplace": false,
  "social_proof": false,
  "financing_simulation": false,
  "webhooks": false,
  "intent_scores": false,
  "show_alternatives": true,
  "show_competitor_banners": true
}
```

## 9. Requisitos funcionais

### RF-01. Cadastro de planos

O admin deve poder:

- criar planos
- editar nome, descrição e preço
- marcar features por formulário estruturado
- visualizar preview do plano resultante

### RF-02. Catálogo administrável

O sistema deve manter um dicionário único de features monetizáveis, usado por:

- ActiveAdmin
- resolvedor backend
- dashboard
- perfil público
- pricing page

### RF-03. Resolvedor central de acesso

O sistema deve possuir um resolvedor central que:

- recebe `company`
- considera `plan`, `plan_status` e overrides
- devolve um payload padronizado de acesso por feature

Formato esperado:

```json
{
  "custom_ctas": {
    "state": "enabled"
  },
  "advanced_analytics": {
    "state": "locked",
    "reason": "upgrade_required"
  },
  "webhooks": {
    "state": "hidden",
    "reason": "not_in_plan"
  }
}
```

### RF-04. Enforcement backend

Endpoints sensíveis devem respeitar o resolvedor.

Exemplos:

- não retornar dados reais de leads para plano sem acesso
- bloquear CRUD de materiais baixáveis quando a feature não estiver liberada
- bloquear renderização de CTAs premium no payload público

### RF-05. Dashboard orientado a entitlement

O dashboard deve:

- construir tabs a partir de `feature_access`
- mostrar conteúdo completo em `enabled`
- mostrar teaser com blur leve e CTA em `locked`
- esconder navegação em `hidden`

### RF-06. Página pública orientada a entitlement

O perfil público da empresa deve:

- renderizar blocos premium apenas quando liberados
- remover alternativas e banners de concorrentes para planos pagos
- parar de depender de `active_admin` como gate comercial

### RF-07. Pricing page comercial

Deve existir uma página `/pricing` com:

- cards dos planos
- comparação por feature
- CTA de conversão
- linguagem visual alinhada à plataforma
- mensagem clara de diferenciação entre gratuito, Pro e Enterprise

### RF-08. Compatibilidade de rotas

As rotas `/plans` e `/prices` devem funcionar como aliases para `/pricing`.

## 10. Requisitos não funcionais

### RNF-01. Escalabilidade

- novas features não podem exigir refatoração de cada tela manualmente
- novos planos devem ser configuráveis sem reescrever frontend inteiro

### RNF-02. Resiliência

- falha no parsing de features deve cair em estado seguro
- ausência de feature deve resultar em `locked` ou `hidden`, nunca em exposição indevida

### RNF-03. Operabilidade

- admin não deve editar JSON cru como fluxo principal
- overrides precisam ser rastreáveis e raros

### RNF-04. Auditabilidade

- mudanças de plano e overrides devem ser visíveis operacionalmente
- o resultado final de acesso deve ser inspecionável no admin

### RNF-05. Compatibilidade incremental

- o sistema deve suportar migração gradual das flags legadas

## 11. Métricas de sucesso

- redução de uso de flags legadas em regras comerciais
- 100% das tabs premium consumindo `feature_access`
- 100% dos endpoints sensíveis com enforcement explícito
- aumento de CTR em CTAs de upgrade dentro do dashboard
- redução de inconsistência entre plano e UI percebida por suporte/comercial

## 12. Riscos

- manter semântica ambígua entre `active_admin` e entitlement
- entregar dado sensível e esconder só com blur
- criar muitos overrides e perder governança
- ligar pricing page a uma API ainda não normalizada

## 13. Estratégia de rollout

### Fase A

- catálogo canônico
- resolvedor central
- aliases temporários

### Fase B

- ActiveAdmin estruturado
- endpoint de `feature_access`

### Fase C

- dashboard
- perfil público

### Fase D

- pricing page
- ajustes de upgrade funnel

## 14. Decisões de produto do V1

- teremos três planos: `Gratuito`, `Pro`, `Enterprise`
- o diferencial mais forte do `Pro` será merchandising + conversão + supressão de concorrência
- o diferencial mais forte do `Enterprise` será dados + integrações + operação avançada
