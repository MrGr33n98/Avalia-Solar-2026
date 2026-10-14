# Checklist de Produção — Propostas

- [x] Migrations de backfill executadas e verificadas (`db/migrate/20261006000000_backfill_marketplace_proposal_drafts.rb`).
- [x] Testes de segurança IDOR, buyer mismatch e draft disclosure aprovados (`spec/requests/api/v1/marketplace_proposals_security_spec.rb`).
- [x] Fluxo E2E Playwright sem mock validado (`tests/e2e/marketplace-proposals.spec.ts`).
- [x] Observabilidade e métricas ativas em `Marketplace::ProposalEventTracker`.
- [x] Rollback plan: as migrations de dados são seguras e não destrutivas.
