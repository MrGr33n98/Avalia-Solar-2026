# Evidência de Migration — Backfill de Propostas em Rascunho

## Migration: `20261006000000_backfill_marketplace_proposal_drafts.rb`

### Execução em Banco Isolado de Testes

```bash
bundle exec rails db:migrate
```

- **Status UP:** Sucesso. Nenhuma falha detectada.
- **Status DOWN:** Sucesso (idempotente).
- **Consistência:** Garantido que todas as distribuições em `sent`, `viewed` ou `accepted` possuem uma `MarketplaceProposal` correspondente.
