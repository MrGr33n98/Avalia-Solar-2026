# Matriz de gaps

| ID | Área | Estado | Evidência / bloqueio |
| --- | --- | --- | --- |
| CAM-101–104 | Routing NaN/loading | PASS parcial | Rotas e teste unitário passam; browser autenticado ainda não executado |
| CAM-105–111 | Audiências/templates | PARCIAL | Listas reais e CRUD template; saved audience save disponível; edição/duplicação e builder completo faltam |
| CAM-112 | Sequences | PARCIAL | Listagem, criação e primeiro step configurável reais; multi-step engine/enrollment faltam |
| CAM-113 | Campaign 360 | PARCIAL | Overview e abas recipients/analytics/settings agora existem; activity timeline agora existe; browser autenticado ainda falta |
| CAM-114–121 | Tracking/attribution | NÃO COMPROVADO | Specs e serviços existem; E2E provider não executado |
| CAM-115–118 | Suppression/deliverability | PARCIAL | Suppression API existe; workspace de suppression/deliverability existe; verificação real de domínio falta |
| CAM-122–129 | P2/P3 | ABERTO | Fora de P0 atual |
| Segurança | Tenant/RBAC | PARCIAL | Campaign scoped; Audience policy/CRUD adicionados; auditoria cross-tenant pendente |
| Qualidade | Frontend | PASS focado | 18 testes de campanha/API e typecheck passam; lint global falha em arquivos preexistentes |
| Qualidade | Backend | NÃO COMPROVADO | Ruby local ausente; suite Rails/Sidekiq e E2E provider não executados |
