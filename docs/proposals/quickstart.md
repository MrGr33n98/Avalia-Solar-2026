# Guia de Execução Local — Testes da Jornada de Propostas

## Instruções de Execução

### Backend (Rails Specs)

```bash
cd AB0-1-back
bundle exec rspec spec/requests/api/v1/marketplace_proposals_spec.rb
bundle exec rspec spec/services/marketplace/proposal_bootstrap_service_spec.rb
```

### Frontend (Jest + React Testing Library)

```bash
cd AB0-1-front
npm run test __tests__/components/MarketplaceProposalsWorkspace.test.tsx
```

### Frontend E2E (Playwright)

```bash
cd AB0-1-front
npx playwright test tests/e2e/marketplace-proposals.spec.ts
```

## Regras de Banco de Dados para Teste

- Nunca executar testes contra banco de produção.
- Utilizar transações limpas ou `DatabaseCleaner` entre os cenários.
- Evitar mocks/interceptações HTTP que mascarem ausência de dados reais nas suítes de validação de fluxo.
