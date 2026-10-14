# 06 — Implementation Checklist

## Checklist de Execução & Status das Fases

- [x] **Fase 0 — Baseline & Auditoria:**
  - [x] Mapeamento de rotas, controllers, models e componentes existentes.
  - [x] Diagnóstico de bugs comprovados (G-01 a G-05).
  - [x] Criação de `00_AS_IS_EVIDENCE.md` e `01_GAP_RCA.md`.

- [x] **Fase 1 — Fix do Módulo Atual & Desacoplamento:**
  - [x] Desacoplamento entre "Ver Proposta" (`ProposalReadonlyPreview`) e "Editar Rascunho" (`ProposalWizardEditor`).
  - [x] Correção de fallback silencioso no deep link (`/dashboard/proposals?id=1`).
  - [x] Seleção explícita de oportunidade ao criar nova proposta (`SelectEligibleLeadDialog`).

- [x] **Fase 2 — Modelos & Contratos de Domínio:**
  - [x] Definição dos 5 modelos PDF originais em `lib/proposals/domain.ts`.
  - [x] Definição dos campos de formulário e serializadores de terms versionados.
  - [x] Compatibilidade estrita com a API Rails existente.

- [x] **Fase 3 — Estúdio de Templates & Form Builder:**
  - [x] Implementação da aba `Formulário (2)` com switches e suporte a campos personalizados.
  - [x] Implementação da aba `Template PDF (3)` com cards dos 5 modelos, seletor de cores WCAG e seções modulares.
  - [x] Editores inline expansíveis para seções de Sobre a Empresa, Garantias, Cronograma e Termos.

- [x] **Fase 4 — Proposta Digital & Condições Comerciais:**
  - [x] Implementação da aba `Proposta Digital (4)` com switches de Hero Banner, ROI e especificações.
  - [x] Implementação da aba `Condições Comerciais (5)` com validade, formas de pagamento e notas comerciais.
  - [x] Persistência em lote transacional no backend via `companyMarketplaceProposalsApi.update`.

- [x] **Fase 5 — Pré-visualização Unificada (PDF vs Digital):**
  - [x] `ProposalReadonlyPreview` com alternador instantâneo entre Documento PDF e Proposta Web.
  - [x] Renderização fiel dos estilos do modelo selecionado e cores da integradora.

- [x] **Fase 6 — Validação & Testes Automatizados:**
  - [x] 8 suítes de testes Jest executadas com 100% de sucesso (29 testes passando).
  - [x] Typecheck com TypeScript (`tsc --noEmit`) concluído com código 0.
