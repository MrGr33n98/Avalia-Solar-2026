# Creator Ecosystem — Fase 5

## Escopo

Attribution e analytics de compartilhamento no Share Center, reutilizando pipeline analytics existente.

## Alterações

- `ShareModal` envia URL com UTM em todos os destinos:
  - `utm_source`
  - `utm_medium=social`
  - `utm_campaign=creator_share`
  - `utm_content`
- Cópia recebe `utm_source=copy`.
- `Mais opções` usa `navigator.share` quando disponível e clipboard como fallback.
- Evento `creator_share_clicked` inclui:
  - `resource_type`
  - `resource_id`
  - `subject_type`
  - `subject_id`
  - `platform`
  - `format`
  - `placement`
- Criado `CopyLinkRow` com URL atribuída visível.

## Persistência

O evento passa pelo `track()` existente, que envia para PostHog, GTM e `/api/v1/analytics/track`, respeitando consentimento LGPD, deduplicação e fila offline já existentes.

Nenhuma tabela nova foi criada nesta etapa. Backend `share_events` dedicado permanece opcional para evolução posterior.

## Segurança

- Nenhuma PII é adicionada ao payload.
- URLs usam recurso canônico fornecido pelo chamador.
- Não há publicação automática fingida em redes sociais.
- Falha de analytics não bloqueia compartilhamento.

## Validação

- `npm run typecheck`: passou.
- `ShareModal.test.tsx`: passou.
- Templates sociais: 4 testes passaram.
- `git diff --check`: passou.

## Pendências

- Backend dedicado `share_events`, caso agregação por recurso/plataforma exija consulta própria.
- Endpoint `share_assets` para formatos visuais persistentes.
- Testes de todos destinos UTM.
- Fase 6: Creator Analytics com métricas reais de distribuição, perfil, Tree, WhatsApp e leads.
