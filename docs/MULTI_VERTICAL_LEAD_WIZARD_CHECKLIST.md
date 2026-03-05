# Checklist Técnico: Multi-Vertical Lead Wizard

- Status: draft
- Data: 2026-03-05
- Escopo: `AB0-1-back` + `AB0-1-front`
- Objetivo: preparar um handoff técnico pronto para virar story sem abrir contratos paralelos nem conflitar com o fluxo atual de leads

## Contexto

O projeto já possui:

- `category_lead_wizards` como origem de schema por categoria
- `GET /api/v1/lead_wizards/resolve` como endpoint público de resolução
- `LeadWizard::Creator` como serviço central de criação
- `leads.wizard_answers` como armazenamento atual de campos dinâmicos
- `preferred_company_id` já trafegando no fluxo, mas ainda sem efeito real no resolvedor
- frontend dinâmico em `AB0-1-front/src/modules/leadWizard`

Ao mesmo tempo, o código atual ainda acopla o wizard a um core fixo do fluxo solar:

- `product_vertical`
- `project_profile`
- `quote_type`
- `system_size_band`
- `decision_timeline`
- `address_full`

Esses campos continuam obrigatórios no model `Lead` quando `wizard_status != draft`.

## Decisões Já Travadas

Estas decisões já estão alinhadas com o código atual e não devem ser reabertas na story inicial:

- [x] Reaproveitar `GET /api/v1/lead_wizards/resolve`
- [x] Manter `category_id` como base de resolução
- [x] Usar `preferred_company_id` como filtro de disponibilidade
- [x] Manter `leads.wizard_answers` como source of truth dos campos variáveis na Fase 1
- [x] Manter `fields[].key` como contrato do schema
- [x] Preservar fallback legado quando não houver wizard configurado
- [x] Evitar novo endpoint para resolver wizard
- [x] Evitar novo JSONB para substituir `wizard_answers` nesta fase

## Pré-condição Obrigatória

Antes de quebrar o trabalho em implementação, a story precisa fixar uma destas duas estratégias:

- [ ] Estrategia A: compatibilidade forte na Fase 1
  O backend continua exigindo o core fixo do `Lead`, e cada wizard por categoria deve mapear campos mínimos para essas colunas reais.
- [ ] Estrategia B: validação guiada por schema
  O backend remove a obrigatoriedade global do core solar e passa a validar presença com base no schema resolvido.

Recomendação: iniciar pela Estrategia A para reduzir risco de regressão no fluxo atual.

## Fatiamento Recomendado

### Story 1: Contrato do Schema e Resolvedor

**Objetivo**
Fechar o contrato de leitura do wizard por categoria sem quebrar o endpoint atual.

**Checklist**

- [ ] Formalizar o contrato de `category_lead_wizards.schema`
- [ ] Garantir uso exclusivo de `fields[].key`
- [ ] Definir quais tipos de campo entram na Fase 1
- [ ] Definir metadados opcionais de step (`title`, `description`)
- [ ] Definir metadados opcionais de campo (`placeholder`, `required`, `options`, `dependsOn`, `errorMessage`)
- [ ] Estender `LeadWizard::Resolver` para validar disponibilidade por `preferred_company_id`
- [ ] Validar associação real via `categories_companies`
- [ ] Definir resposta para empresa associada
- [ ] Definir resposta para empresa não associada
- [ ] Definir resposta para categoria sem wizard configurado
- [ ] Preservar `template_key`, `template_version` e `thank_you_config`

**Acceptance Criteria sugeridos**

- [ ] `GET /api/v1/lead_wizards/resolve` continua sendo o único contrato de leitura
- [ ] O resolver diferencia `source: category` e `source: default`
- [ ] A resposta informa claramente se a empresa pode ou não operar na categoria
- [ ] Categorias sem wizard configurado continuam retornando fallback legado

**Arquivos candidatos**

- `AB0-1-back/app/services/lead_wizard/resolver.rb`
- `AB0-1-back/app/controllers/api/v1/lead_wizards_controller.rb`
- `AB0-1-back/app/models/category_lead_wizard.rb`
- `AB0-1-back/spec/`

### Story 2: Persistência e Compatibilidade no Creator

**Objetivo**
Fazer o payload dinâmico persistir corretamente sem quebrar o modelo atual de lead.

**Checklist**

- [ ] Formalizar o payload de submissão para `POST /api/v1/leads/wizard_create`
- [ ] Definir quais campos entram em `lead`
- [ ] Definir quais campos entram em `wizard_answers`
- [ ] Introduzir mapeamento explícito de persistência por campo
- [ ] Manter `wizard_answers` como source of truth dos campos dinâmicos
- [ ] Garantir persistência de `product_vertical`
- [ ] Garantir persistência das colunas reais exigidas pelo `Lead`, se a Fase 1 seguir Estrategia A
- [ ] Revisar o `LeadWizard::Creator` para repassar `preferred_company_id` ao resolver também na criação
- [ ] Definir se `attribution_json` será preenchido pelo wizard nesta fase
- [ ] Garantir compatibilidade com payload legado em `snake_case`
- [ ] Garantir compatibilidade com payload legado em `camelCase`, se ainda existir uso real

**Acceptance Criteria sugeridos**

- [ ] `wizard_create` aceita payload dinâmico sem quebrar o fluxo solar atual
- [ ] Campos variáveis são persistidos em `leads.wizard_answers`
- [ ] `product_vertical` e `category_id` ficam coerentes com a categoria resolvida
- [ ] O lead continua sendo criado com OTP e fluxo atual intacto

**Arquivos candidatos**

- `AB0-1-back/app/services/lead_wizard/creator.rb`
- `AB0-1-back/app/models/lead.rb`
- `AB0-1-back/app/controllers/api/v1/leads_controller.rb`
- `AB0-1-back/spec/requests/api/v1/leads_wizard_spec.rb`
- `AB0-1-back/spec/models/`

### Story 3: Frontend Dinâmico e Step 0

**Objetivo**
Entregar a UX multi-vertical sem criar um fluxo paralelo ao modal existente.

**Checklist**

- [ ] Criar o Step 0 de seleção de intenção para empresas multi-categoria
- [ ] Reaproveitar o `LeadWizardEngine` existente
- [ ] Garantir fluxo direto para empresa monocategoria
- [ ] Garantir seleção explícita para empresa multicategoria
- [ ] Carregar schema pelo endpoint existente após escolha da categoria
- [ ] Alinhar `buildPayload` do frontend ao contrato final do backend
- [ ] Garantir que campos destinados ao core do lead não fiquem presos apenas em `wizard_answers`
- [ ] Traduzir erros de validação por campo no renderer
- [ ] Preservar autosave da sessão
- [ ] Preservar callback de sucesso e abandono

**Acceptance Criteria sugeridos**

- [ ] Empresa monocategoria abre diretamente o wizard correto
- [ ] Empresa multicategoria mostra Step 0 antes da resolução final
- [ ] O payload enviado pelo frontend é compatível com o creator
- [ ] O fallback legado continua renderizável pelo engine

**Arquivos candidatos**

- `AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts`
- `AB0-1-front/src/modules/leadWizard/api/wizard.api.ts`
- `AB0-1-front/src/modules/leadWizard/types/wizard.types.ts`
- `AB0-1-front/src/modules/leadWizard/components/LeadWizardEngine.tsx`
- `AB0-1-front/src/modules/leadWizard/components/`

### Story 4: Analytics e Atribuição

**Objetivo**
Instrumentar o funil por vertical sem duplicar eventos nem quebrar o pipeline atual.

**Checklist**

- [ ] Mapear os eventos já emitidos pelo frontend
- [ ] Manter `lead_initiated` no backend
- [ ] Manter `lead_created` no model `Lead`
- [ ] Definir evento para seleção de intenção no Step 0
- [ ] Padronizar metadata mínima por vertical
- [ ] Definir metadata mínima por step
- [ ] Definir regra para abandono com preenchimento parcial
- [ ] Decidir se `attribution_json` será o alvo persistido para contexto do wizard
- [ ] Validar compatibilidade com `Analytics::TrackEventService`
- [ ] Revisar risco de duplicidade entre frontend e backend

**Acceptance Criteria sugeridos**

- [ ] O funil consegue ser lido por categoria e por template
- [ ] Não há duplicação desnecessária entre eventos de frontend e backend
- [ ] Eventos continuam passando pelo pipeline padrão de analytics

**Arquivos candidatos**

- `AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts`
- `AB0-1-back/app/controllers/api/v1/leads_controller.rb`
- `AB0-1-back/app/models/lead.rb`
- `AB0-1-back/app/services/analytics/track_event_service.rb`
- `AB0-1-back/docs/analytics-spec.md`

## Tipos de Campo Recomendados para Fase 1

Manter a Fase 1 limitada aos tipos já suportados pelo frontend atual:

- [x] `text`
- [x] `email`
- [x] `tel`
- [x] `select`
- [x] `radio`
- [x] `checkbox`
- [x] `currency`
- [x] `zipcode`
- [x] `slider`
- [x] `textarea`
- [ ] `file_upload` fica para fase posterior

## Campos e Regras que Precisam de Mapeamento

Para evitar drift entre schema e persistência, cada campo do wizard deve ter destino explícito:

- [ ] campos de contato base
  `full_name`, `email`, `phone`, `zipcode`, `city`, `state`, `consent`
- [ ] campos obrigatórios do lead atual
  `product_vertical`, `project_profile`, `quote_type`, `system_size_band`, `decision_timeline`, `address_full`
- [ ] campos específicos de vertical
  persistidos em `wizard_answers`
- [ ] campos de atribuição
  decidir entre `attribution_json`, UTMs planas ou ambos

## Riscos Técnicos que Devem Entrar na Story

- [ ] risco de regressão no fluxo solar atual se as validações do `Lead` forem alteradas
- [ ] risco de o frontend enviar tudo em `wizard_answers` e falhar nas colunas obrigatórias
- [ ] risco de fallback mascarar erro real de disponibilidade da empresa
- [ ] risco de duplicidade de analytics entre frontend e backend
- [ ] risco de introduzir `file_upload` antes do contrato básico estar estável

## Ordem Recomendada de Implementação

- [ ] 1. Resolver e contrato do schema
- [ ] 2. Creator e persistência
- [ ] 3. Frontend payload e Step 0
- [ ] 4. Analytics e atribuição
- [ ] 5. Seeds/configuração inicial para Solar Residencial e Mobilidade Elétrica

## Validação Mínima Esperada

- [ ] backend: specs de request para `resolve` e `wizard_create`
- [ ] backend: specs de model/service para resolução por empresa e fallback
- [ ] frontend: teste do hook `useLeadWizard`
- [ ] frontend: teste do Step 0 para empresa multicategoria
- [ ] frontend: teste de payload final enviado ao backend
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`

## Referências

- `AB0-1-back/app/services/lead_wizard/resolver.rb`
- `AB0-1-back/app/services/lead_wizard/creator.rb`
- `AB0-1-back/app/controllers/api/v1/lead_wizards_controller.rb`
- `AB0-1-back/app/controllers/api/v1/leads_controller.rb`
- `AB0-1-back/app/models/lead.rb`
- `AB0-1-back/db/schema.rb`
- `AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts`
- `AB0-1-front/src/modules/leadWizard/api/wizard.api.ts`
- `AB0-1-front/src/modules/leadWizard/types/wizard.types.ts`
- `AB0-1-front/docs/stories/STORY-2026-02-28-lead-wizard-validation-recovery.md`
