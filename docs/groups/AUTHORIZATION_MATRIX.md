# Groups Authorization Matrix

Status: contrato de planejamento.

| Ação | Visitante | Membro | Moderador | Admin | Owner |
|---|---:|---:|---:|---:|---:|
| Ver grupo público | Sim | Sim | Sim | Sim | Sim |
| Ver grupo privado | Não | Conforme membership | Sim | Sim | Sim |
| Ver resumo de membros público | Sim | Sim | Sim | Sim | Sim |
| Entrar em grupo aberto | Não autenticado: não | Sim | Sim | Sim | Sim |
| Criar post | Não | Sim, conforme posting_mode | Sim | Sim | Sim |
| Comentar/reagir/salvar | Não | Sim | Sim | Sim | Sim |
| Fixar/ocultar post | Não | Não | Sim | Sim | Sim |
| Aprovar membership | Não | Não | Conforme política | Sim | Sim |
| Gerenciar regras/tópicos | Não | Não | Não | Sim | Sim |
| Gerenciar configurações | Não | Não | Não | Sim | Sim |
| Transferir ownership | Não | Não | Não | Não | Sim |
| Arquivar grupo | Não | Não | Não | Sim | Sim |

## Invariantes

- Backend sempre executa Pundit; frontend hiding não é autorização.
- Policy scopes filtram visibilidade antes de carregar registros.
- Membership ativa é condição necessária para postar em grupo não público.
- `posting_mode` pode restringir criação a moderadores/admins/owner.
- IDOR é proibido: slug/id recebido deve ser resolvido dentro do scope autorizado.
