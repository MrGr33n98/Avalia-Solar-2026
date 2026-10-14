# 08 — Rollout & Rollback Strategy

## 1. Estratégia de Rollout
- As alterações implementadas no frontend (`ProposalDetailsPane`, `ProposalReadonlyPreview`, `domain.ts`, `CompanyMarketplaceProposalsWorkspace`) são aditivas e 100% retrocompatíveis.
- Utilizam os endpoints e entidades existentes de `terms` em `MarketplaceProposalVersion`, sem exigir migrações destrutivas no banco de dados de produção.
- Podem ser implantadas imediatamente após a validação no ambiente de staging.

## 2. Procedimento de Rollback
- Caso seja necessário reverter para a versão anterior:
  1. No Git: `git revert <commit_hash>` ou checkout do commit imediatamente anterior à introdução do Proposal Studio.
  2. Nenhuma intervenção no PostgreSQL é necessária, pois a estrutura da tabela `marketplace_proposal_terms` e os dados legados continuam inalterados.
  3. Reconstruir a imagem Docker do frontend (`Dockerfile.frontend`) e reiniciar os containers via Docker Compose.
