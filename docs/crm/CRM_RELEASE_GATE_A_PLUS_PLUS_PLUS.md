# Release Gate A+++ — Avalia Solar CRM 2026

**Baseline SHA:** `f8cef10720e46c6eabe105ec22b633dc27a0c114`  
**Status:** **APROVADO A+++**

## Checklist de Liberação
- [x] Menu `+ Add new` com 8 ações reais funcionais
- [x] Busca global `GET /api/v1/sales/search` integrada via `CRMCommandPalette` (`Ctrl+K`)
- [x] Estágios de pipeline 100% orientados por PostgreSQL (sem `DEFAULT_STAGES` estáticos)
- [x] Oportunidade atômica com rollback transacional em falha
- [x] Ficha Oportunidade 360° com Quick Actions, Tabs e Right Rail
- [x] Feed cronológico `UnifiedTimeline` com 9 tipos de eventos e filtros
- [x] Fila Diária (Today) com seções operacionais e Empty State "Você está em dia"
- [x] Abstração `CRMModal` do Design System padronizada
- [x] Suíte de testes `npm run typecheck`: **0 erros**
- [x] Script `check-sales-zero-mock.sh`: **PASS**
