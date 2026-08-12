# Retention e LGPD

Política codificada em `Chat::RetentionPolicy`:

- `ChatSession`: 90 dias.
- `ChatMessage`: 90 dias.
- `ChatLead`: 730 dias, conforme finalidade comercial/legal.
- Attachments: 30 dias após não necessidade operacional.
- Analytics: 730 dias, sem conteúdo raw/PII desnecessária.

PII mapeada: name, phone, email, city/state, IP, user agent e attachments. Anonimização preparada para lead; deleção física exige confirmação jurídica e job operacional.
