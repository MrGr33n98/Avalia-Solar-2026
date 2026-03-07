## Why

O Company Dashboard concentra fluxos críticos de edição de perfil, categorias, mídia, selo de confiança, banners e destaque de reviews, mas hoje esses fluxos têm baixa rastreabilidade operacional e comportamentos inconsistentes entre frontend, backend e Active Admin. A auditoria já realizada no repositório identificou lacunas objetivas em feedback de aprovação, entrega de notificações, preview de mídia, renderização de badges e enforcement de features pagas, o que justifica formalizar uma mudança orientada por spec antes de implementar hotfixes e a fundação de planos.

## What Changes

- Formalizar o fluxo ponta a ponta de edição do Company Dashboard, incluindo ações de usuário, endpoints, persistência temporária, notificações e aprovação operacional.
- Definir requisitos para que alterações sujeitas a revisão exibam estado explícito de "em revisão" e gerem notificações operacionais rastreáveis, sem depender apenas de analytics.
- Definir requisitos para integridade da aba de mídia e preview, cobrindo upload de imagens, variantes, validação de links de vídeo e visualização do perfil em estados pendentes.
- Definir requisitos para entrega confiável do selo de confiança, incluindo geração de badge, embed, cache e compatibilidade de abertura.
- Introduzir controle de features pagas por plano e por override customizado de empresa, com enforcement backend e exposição consistente para frontend e Active Admin.
- Definir um gráfico técnico versionado na documentação da change para representar o fluxo de informação entre dashboard, API, serviços, storage e admin.

## Capabilities

### New Capabilities
- `company-dashboard-change-review`: fluxos auditáveis de edição com `PendingChange`, feedback de revisão, notificação operacional e aprovação no Active Admin.
- `company-dashboard-media-integrity`: consistência de upload, validação, preview e publicação de imagens, vídeos e badge embed no Company Dashboard.
- `company-dashboard-feature-gating`: controle de recursos pagos por plano, limites e overrides por empresa com exposição para frontend, backend e Active Admin.

### Modified Capabilities

None.

## Impact

- Backend Rails em `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`, `AB0-1-back/app/controllers/api/v1/badges_controller.rb`, controladores de banners e serviços/notificações relacionados.
- Frontend React/Next em componentes do Company Dashboard para categorias, mídia, preview, badges, social proof e upsell de destaque de review.
- Recursos do Active Admin para empresas, pending changes, badges, banners e futura gestão de features.
- Modelagem de dados para planos, features, subscriptions e overrides.
- Operação e observabilidade, porque notificações e aprovações deixam de depender apenas de eventos analíticos.
