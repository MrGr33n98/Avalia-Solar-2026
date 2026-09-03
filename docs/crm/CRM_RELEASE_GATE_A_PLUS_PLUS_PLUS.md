# Release Gate A+++ — Avalia Solar CRM 2026

**Baseline SHA:** `c9d39694984462c54bb5343008f9741233c94600`  
**Status:** **A+++ RELEASE CANDIDATE**

## Checklist de Liberação
- [ ] Menu `+ Add new` com 8 ações reais funcionais (E2E Playwright em progresso)
- [x] Busca global `GET /api/v1/sales/search` integrada via `CRMCommandPalette` (`Ctrl+K`)
- [x] Estágios de pipeline 100% orientados por PostgreSQL (sem `DEFAULT_STAGES` estáticos)
- [x] Oportunidade atômica com rollback transacional em falha
- [ ] Ficha Oportunidade 360° com Quick Actions, Timeline canônica e zero synthetic values
- [ ] Feed cronológico `UnifiedTimeline` alimentado via `GET /api/v1/sales/opportunities/:id/timeline`
- [x] Fila Diária (Today) com seções operacionais e Empty State "Você está em dia"
- [x] Abstração `CRMModal` do Design System padronizada
- [x] Suíte de testes `npm run typecheck`: **0 erros**
- [x] Script `check-sales-zero-mock.sh`: **PASS**
