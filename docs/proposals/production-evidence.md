# Registro de Evidências — Endpoint de Propostas

## Contexto e Diagnóstico

- **Data da Auditoria:** 2026-10-07
- **Ambiente:** Desenvolvimento / Testes locais
- **Endpoint Principal:** `GET /api/v1/proposals`

## Comportamento Atual do Endpoint

1. **Rota no Backend:** `GET /api/v1/marketplace_proposals` (aliased/mapped via controller ou frontend proxy `/api/v1/proposals`).
2. **Entitlements e Autenticação:**
   - Exige token JWT de comprador (`buyer`) ou usuário autenticado vinculado.
   - Responde com `[]` caso não existam propostas vinculadas ao e-mail/usuário logado ou caso o lead não tenha propostas publicadas.
3. **Escopo de Dados:**
   - As propostas são filtradas por `MarketplaceProposal.for_user(user)` ou por e-mail correspondente ao lead da solicitação (`Lead.by_email`).
   - Rascunhos (`draft`) não são exibidos para compradores até a publicação da versão (`MarketplaceProposalVersion` publicada).

## Evidência de Execução Local

```json
{
  "proposals": [],
  "meta": {
    "total_count": 0,
    "page": 1,
    "per_page": 25
  }
}
```

## Próximos Passos
- Garantir bootstrap automático de `MarketplaceProposal` na distribuição do lead.
- Garantir idempotência e suporte completo à jornada de 10 estados de UI.
