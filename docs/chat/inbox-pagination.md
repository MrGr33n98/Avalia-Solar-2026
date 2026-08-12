# Inbox Pagination

Inbox usa cursor opaco baseado em `last_message_at + id`. Mensagens usam `created_at + id`. API retorna `next_cursor`; limite inicial permanece 30 sessões e 50 mensagens. Cursor inválido retorna `400`.
