# Mobile Platform Decision — Engineering Announcement

## Summary

A estratégia oficial de mobile do Avalia Solar passa a ser `PWA-first` sobre a base `Next.js 14 + React 18`. O objetivo é eliminar os riscos críticos do diagnóstico atual sem criar uma segunda aplicação em paralelo neste momento.

## What changes now

- Sprint 1 passa a focar em `M-001`, `M-002` e `M-003`
- touch anti-patterns e safe-area deixam de ser opcionais
- mudanças de UI com impacto mobile devem preencher o checklist mobile do PR template

## What does not change

- a aplicação web continua sendo o produto principal nesta fase
- não há app nativo iOS/Android nesta entrega
- o roadmap nativo só será reavaliado no `Q3 2026`

## Source of truth

- `docs/architecture/MADR-001-mobile-platform.md`
- `docs/EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md`
- `docs/MOBILE_DOCUMENTATION_INDEX.md`
