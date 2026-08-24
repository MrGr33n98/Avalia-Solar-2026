# Groups Moderation

Status: planejamento.

## Princípios

- Workflow fica em services `Groups::ModerationService` e `Groups::MembershipService`, não em callbacks espalhados.
- Estados de post: `draft`, `published`, `pending_review`, `hidden`, `removed`.
- Ações administrativas exigem policy, actor identificado, motivo quando aplicável e audit log.
- Reports não devem expor dados sensíveis para viewers não autorizados.
- Body deve ser sanitizado antes de renderização; attachments devem validar tipo, tamanho e ownership.

## Escopo inicial

- report post/comment;
- hide/restore/remove;
- approve/reject join request;
- ban/mute membership;
- pin/unpin por moderator/admin/owner;
- rate limit para posts, reports, invites e join requests.

## Eventos

Eventos mínimos: `group.report.created`, `group.post.pinned`, `group.member.approved`, `group.member.banned`.
Payload deve conter apenas IDs, ação, status e timestamps necessários; nunca password, token, body integral ou PII desnecessária.
