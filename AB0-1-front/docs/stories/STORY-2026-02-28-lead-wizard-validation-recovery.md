# STORY-2026-02-28: Recuperar criação de lead no wizard e melhorar erro exibido no modal

## Contexto
Após o backend de produção voltar a subir, o modal de orçamento na página de empresa passou a retornar `422 validation_failed`. O payload chegava ao endpoint `wizard_create`, mas o serviço `LeadWizard::Creator` não persistia nos campos reais do `Lead` os atributos obrigatórios do wizard (`product_vertical`, `project_profile`, `quote_type`, `system_size_band`, `decision_timeline` e `address_full`), fazendo as validações de `pending_otp` falharem. Além disso, o modal completo ainda enviava parte do payload em `camelCase` e o frontend mostrava apenas o erro cru.

## Requisito
Normalizar o payload do wizard para aceitar os formatos já usados pelos modais, persistir corretamente os campos obrigatórios do lead e exibir uma mensagem de erro útil quando a API devolver `fields`.

## Acceptance Criteria
- [x] `LeadWizard::Creator` salva os campos obrigatórios do wizard no `Lead`.
- [x] O backend aceita payload legado em `snake_case` e payload do modal completo em `camelCase`.
- [x] `QuickLeadModal` deixa de exibir apenas `[422] validation_failed` e mostra uma mensagem legível.
- [x] `QuoteWizardModal` envia chaves canônicas do backend para evitar falha de mapeamento.

## Checklist de Implementação
- [x] Normalizar a leitura de `lead` e `wizard_answers` no creator.
- [x] Mapear campos obrigatórios do wizard para colunas reais do `Lead`.
- [x] Preservar compatibilidade com payloads `snake_case` e `camelCase`.
- [x] Ajustar os modais para traduzir `fields` da API em mensagem legível.
- [x] Alinhar o payload do modal completo para `snake_case`.
- [x] Tentar rodar spec relevante do backend ou documentar bloqueio.
- [x] Rodar lint do frontend.
- [x] Rodar typecheck do frontend ou documentar bloqueio.
- [x] Rodar teste do frontend ou documentar bloqueio.

## File List
- [x] `../../AB0-1-back/app/services/lead_wizard/creator.rb`
- [x] `../../AB0-1-back/spec/requests/api/v1/leads_wizard_spec.rb`
- [x] `components/QuickLeadModal.tsx`
- [x] `components/QuoteWizardModal.tsx`
- [x] `../../AB0-1-front/src/modules/leadWizard/api/wizard.api.ts`
- [x] `../../AB0-1-front/src/modules/leadWizard/components/WizardRenderer.tsx`
- [x] `../../AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts`
- [x] `../../AB0-1-front/src/modules/leadWizard/types/wizard.types.ts`
- [x] `docs/stories/STORY-2026-02-28-lead-wizard-validation-recovery.md`

## Validation
- [x] `ruby -c ../../AB0-1-back/app/services/lead_wizard/creator.rb`
- [x] `ruby -c ../../AB0-1-back/spec/requests/api/v1/leads_wizard_spec.rb`
- [x] `bundle exec rspec spec/requests/api/v1/leads_wizard_spec.rb` (bloqueado no ambiente: executável `rspec` indisponível sem `bundle install`)
- [x] `npm run lint` (passou com warnings preexistentes fora deste ajuste)
- [x] `npm run typecheck` (bloqueado: script inexistente no `package.json`)
- [x] `node --max-old-space-size=4096 .\\node_modules\\typescript\\bin\\tsc --noEmit` (falhou por erros TypeScript preexistentes fora deste ajuste)
- [x] `npm test -- --runInBand` (falhou por problemas preexistentes do repo: `TransformStream is not defined`, suites E2E/Cypress misturadas no Jest, OOM e outros testes legados)
- [x] `npm run lint` em `../../AB0-1-front` (bloqueado no ambiente atual: `next: command not found`, dependências do frontend indisponíveis)
- [x] `npx tsc --noEmit` em `../../AB0-1-front` (falhou por resolução ausente de dependências/base types do repo local, com milhares de erros globais preexistentes como `Cannot find module 'react'` e `Cannot find module 'next/image'`)
