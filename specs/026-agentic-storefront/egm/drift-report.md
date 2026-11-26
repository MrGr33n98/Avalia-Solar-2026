# EGM Drift Report Inicial: SPEC 026 — Agentic Storefront

**Fase EGM:** Fase 07 — Verificação Contínua e Detecção de Divergências  
**Status:** Baseline Inicial Pré-Implementação  
**Data:** 26 de Novembro de 2026  

---

## 1. Escopo de Comparação
- **Documento de Referência:** `specs/026-agentic-storefront/spec.md`
- **Código Existente:** Módulos legados de `Company`, `Product` e `Dashboard`
- **Ferramenta:** `egm-drift-report`

## 2. Diagnóstico AS-IS (Linha de Base)
- O modelo `Company` existe e já suporta certificações, cidade/UF, avaliações e leads.
- A ferramenta pública `show_storefront_profile` e o serviço `Storefront::PublicProfileService` ainda não foram codificados (aguardando o ciclo TDD da Fase 05).
- A superfície `ui://avalia-solar/storefront/v1.html` ainda não foi adicionada ao build do Vite em `packages/mcp-ui`.

## 3. Próxima Aferição de Drift
O `egm-drift-report` completo será re-executado automaticamente após a conclusão das tarefas de codificação T01 a T20.
