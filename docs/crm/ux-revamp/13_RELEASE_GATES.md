# 13 — Critérios de Release Gates & Procedimentos de Rollback

## 1. Definição dos Gates de Liberação

| Gate | Objetivo | Pré-requisitos Mandatórios | Validação / Comando |
|------|----------|----------------------------|---------------------|
| **Gate A: Baseline READ-ONLY** | Auditoria e diagnóstico sem alterações destrutivas | Status limpo, branch confirmada, matriz de gaps e 14 refs documentadas | `git status`, `typecheck` |
| **Gate B: Segurança & Consistência P0** | Eliminação de falsos sucessos e erros de rota | Correção em `CallLoggerModal`, `CreateActivityModal`, `ActivitiesController` e `routes.rb` | Testes unitários Jest passando |
| **Gate C: Shell & PWA Real** | Navegação responsiva sem quebra do desktop ou marketplace | `CRMMobileBottomNav`, safe-areas, ocultação da nav pública no CRM | Verificação de layout 375px e 1440px |
| **Gate D: Jornadas Core** | Hoje, 360°, Pipeline, Atividades persistidas pós-F5 | Persistência real em banco, sem dados mockados | Fluxo completo verificado |
| **Gate E: Propostas Comerciais** | Emissão de propostas sem digitação manual de IDs | Catálogo de planos oficial integrado | Teste de criação e preview |
| **Gate F: Voz / IA sob Flag** | Transcrição com revisão humana estrita | Consentimento LGPD e provider auditado | Feature flag `NEXT_PUBLIC_ENABLE_CRM_VOICE` |
| **Gate G: PWA Offline Seguro** | Prevenção de perda de dados e isolamento multi-tenant | Cache offline-readonly seguro; fila com idempotência | Flag `NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE` |
| **Gate H: Release Staging** | Validação integrada em homologação | Suíte de testes verde, budgets de performance medidos | `npm run test:ci`, smoke test |

---

## 2. Procedimentos de Rollback e Contingência

1. **Reversão de Feature Flags:**
   - Desativar voz/IA: definir `NEXT_PUBLIC_ENABLE_CRM_VOICE=false`.
   - Desativar offline experimental: definir `NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE=false`.
2. **Reversão de Código Git:**
   - Em caso de anomalia impeditiva, utilizar `git revert <commit-hash>` preservando histórico limpo conforme Conventional Commits.
3. **Rollback de Banco de Dados:**
   - Nenhuma migração destrutiva é executada nesta fase. Todas as alterações são estritamente aditivas e retrocompatíveis.
