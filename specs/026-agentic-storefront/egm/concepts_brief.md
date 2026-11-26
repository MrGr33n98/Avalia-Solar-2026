# Concepts Brief: SPEC 026 — Agentic Storefront

**Fase EGM:** Fase 02 — Brainstorm e Exploração de Alternativas  
**Status:** Consolidado para Redação da Especificação  
**Data:** 26 de Novembro de 2026  

---

## 1. Problema de Negócio
Empresas integradoras no Avalia Solar possuem perfis ricos em dados, mas com conversão passiva. Compradores solares precisam de um fluxo interativo, que combine prova social auditada, demonstração de capacidade técnica (projetos executados) e cálculo prévio de economia para solicitar um orçamento qualificado.

## 2. Alternativas Avaliadas
- **Alternativa A (Página Estática):** Apenas exibir dados estáticos no perfil. *Rejeitada:* Baixa conversão e sem suporte a agentes autônomos.
- **Alternativa B (Módulo Standalone Externo):** Criar uma aplicação separada. *Rejeitada:* Aumenta custo operacional e viola princípio 37signals Rails.
- **Alternativa C (Agentic Storefront Híbrido — Escolhida):** Vitrine web em Next.js 14 App Router integrada ao Company Dashboard existente + Superfície agent-native MCP no padrão `@avalia-solar/mcp-ui` servida pelo Rails.

## 3. Direção Arquitetural Acordada
- Manter o Rails 7 como autoridade de dados, regras de negócio e Pundit policies.
- Expor dados via DTO público v1 e endpoint `/mcp` para agentes de IA.
- Limite estrito de 120 KiB gzip para o widget interativo standalone.

