# C2 — Go/No-Go

## Decisão atual: NO-GO para ativação pública

O código C2 e os testes locais focados estão prontos para revisão, mas não há prova de staging isolado, DNS/TLS, clientes externos, observabilidade operacional ou aprovação de segurança.

## GO somente quando

- PR e CI obrigatório estiverem verdes.
- Staging separado estiver comprovado.
- PKCE, resource, scope, refresh e revogação forem demonstrados ponta a ponta.
- Dois clientes independentes forem aprovados.
- Ausência de PII/PII em logs, quotas, alertas e rollback forem verificados.
- AppSec, Privacidade, Produto e Operações assinarem.

As flags MCP e execução de tools permanecem desligadas por padrão.
