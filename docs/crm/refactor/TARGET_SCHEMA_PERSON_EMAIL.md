# Schema alvo — Person e e-mail

Manter modelos canônicos e evoluir somente após revisão de migrations.

- Timeline: DTO derivado de Contact, Activity, Task, EmailMessage/Event e Opportunity; sem tabela polimórfica duplicada na primeira entrega.
- Engagement: agregação server-side de EmailEvent, com contagens e timestamps reais.
- Templates: grupos e permissões explícitas, mantendo compartilhado/privado compatível com `user_id`.
- Steps: `sales_email_template_steps` futura, com ordem, delay em dias úteis e `send_as_reply`.
- Suppression: registro por company/endereço e motivo, unicidade tenant + endereço normalizado.

Toda migration deve ser reversível, indexada por tenant e acompanhada de specs de isolamento.
