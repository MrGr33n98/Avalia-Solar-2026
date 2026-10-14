# Matriz de Autorização e Entitlements — Propostas do Marketplace

## Regras de Acesso por Perfil

| Ação / Endpoint | Comprador (`buyer`) | Empresa (`company_user`) | Administrador (`admin`) |
| --- | --- | --- | --- |
| `GET /api/v1/proposals` | Sim (apenas propostas vinculadas por ID/E-mail) | Não (usa `company_dashboard`) | Sim (todas) |
| `GET /api/v1/proposals/:id` | Sim (se for o comprador dono) | Não | Sim |
| `POST /api/v1/proposals/:id/view` | Sim | Não | Sim |
| `POST /api/v1/proposals/:id/accept` | Sim (apenas se publicada e válida) | Não | Sim |
| `POST /api/v1/proposals/:id/decline` | Sim | Não | Sim |
| `POST /api/v1/proposals/:id/request_change` | Sim | Não | Sim |
| `POST /api/v1/proposals/:id/meetings` | Sim | Não | Sim |
| `POST /company_dashboard/proposals` | Não | Sim (apenas dentro do tenant da empresa) | Sim |
| `PATCH /company_dashboard/proposals/:id` | Não | Sim (editar rascunho do tenant) | Sim |
| `POST /company_dashboard/proposals/:id/send` | Não | Sim (publicar versão do tenant) | Sim |
| `POST /company_dashboard/proposals/:id/new_version` | Não | Sim (criar nova versão) | Sim |
| `POST /company_dashboard/proposals/:id/withdraw` | Não | Sim (retirar proposta) | Sim |

## Restrições de Rascunho (`draft`) e Vínculo

1. **Rascunhos:** O comprador NÃO consegue ver propostas em estado `draft` antes de serem enviadas/publicadas pela empresa.
2. **Vínculo do Comprador:** Apenas usuários ativos, confirmados e cujo ID ou e-mail coincida com o lead recebem acesso às propostas.
3. **Multi-tenant:** A empresa só visualiza e edita propostas vinculadas à sua própria organização.
