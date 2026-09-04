# Contrato de timeline Person 360

`GET /api/v1/sales/contacts/:id/timeline` retorna `{ timeline: TimelineEntry[], meta?: ... }`.

Cada entrada: `id`, `type`, `title`, `description`, `occurred_at`; entradas devem ser ordenadas por `occurred_at DESC`, filtráveis por tipo e limitadas/paginadas. Controller deve resolver contato no tenant do usuário. Dados inexistentes produzem lista vazia, nunca contagens fictícias.
