# Mapeamento do Contrato Atual de Propostas

## Arquivos Reais no Backend (`AB0-1-back/`)

1. **Controller de Comprador:** `app/controllers/api/v1/marketplace_proposals_controller.rb`
2. **Controller de Empresa:** `app/controllers/api/v1/company_admin/proposals_controller.rb`
3. **Serializer:** `app/serializers/marketplace_proposal_serializer.rb`
4. **Policy Pundit:** `app/policies/marketplace_proposal_policy.rb`
5. **Models:**
   - `app/models/marketplace_proposal.rb`
   - `app/models/marketplace_proposal_version.rb`
   - `app/models/lead_distribution.rb`
6. **Services:**
   - `app/services/marketplace/proposal_bootstrap_service.rb`
   - `app/services/marketplace/proposal_decision_service.rb`
   - `app/services/marketplace/proposal_event_tracker.rb`

## Arquivos Reais no Frontend (`AB0-1-front/`)

1. **Workspace PWA/Web:** `components/reviewer/MarketplaceProposalsWorkspace.tsx`
2. **Componentes da Jornada:** `components/reviewer/proposals/*`
3. **Cliente API / Helpers:** `lib/api.ts` e `lib/marketplace-proposals.ts`
4. **Testes Componentes:** `__tests__/components/MarketplaceProposalsWorkspace.test.tsx`
5. **Testes E2E:** `tests/e2e/marketplace-proposals.spec.ts`

## Estados Canônicos da Proposta

- `draft`: Rascunho da proposta (aguardando envio/publicação da empresa).
- `sent`: Enviada / Publicada para o comprador.
- `viewed`: Visualizada pelo comprador.
- `negotiating`: Em negociação / Reunião agendada / Solicitou alteração.
- `accepted`: Aceita pelo comprador (versão confirmada).
- `project_in_progress`: Projeto em andamento (milestones ativas).
- `completed`: Projeto concluído (avaliação habilitada/enviada).
