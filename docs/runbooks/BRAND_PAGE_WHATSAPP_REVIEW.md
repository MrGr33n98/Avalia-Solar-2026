# Brand Page — avaliações pelo WhatsApp (runbook)

## Contrato
A flag `companies.voice_review_cta_enabled` é independente do WhatsApp comercial e inicia `false`.
O checkbox fica no ActiveAdmin > Empresas > Editar > Coleta de Avaliações.
O CTA verde aparece ao lado de “Fazer uma avaliação” em `ReviewsPreview`
somente quando `review_channels.whatsapp.enabled` for `true`.

## Pré-requisitos de produção
Verificar sem expor segredos: `VOICE_REVIEWS_ENABLED=true`,
`VOICE_REVIEWS_PROVIDER=waha`, `VOICE_REVIEWS_WHATSAPP_NUMBER`,
`WAHA_API_KEY`, `WAHA_WEBHOOK_HMAC_SECRET`,
`VOICE_REVIEWS_CONTACT_PEPPER` (ou fallback seguro), `WAHA_SESSION`,
armazenamento privado e transcrição de áudio.
Verificar status real da sessão WAHA, migrações e Sidekiq na VM.
O resolver esconde o botão quando a configuração obrigatória estiver ausente;
isso não substitui uma verificação de saúde da sessão.

## Homologação
1. Manter todas as empresas desligadas.
2. Ativar apenas uma empresa de QA no ActiveAdmin.
3. Confirmar que `GET /api/v1/companies/:id` retorna `review_channels.whatsapp`
   com `enabled=true` e href oficial `https://wa.me/...`.
4. Validar dois botões lado a lado na visão geral e opção na aba Avaliações.
5. Confirmar que o WhatsApp comercial não foi alterado.
6. Abrir a conversa, enviar o código, conferir aviso de privacidade e responder ACEITO.
7. Enviar notas + relato por texto e por áudio em jornadas separadas.
8. Editar/confirmar o texto; verificar Review pendente de moderação.
9. Aprovar e verificar publicação da avaliação, inclusive avaliações críticas.
10. Repetir código, webhook e confirmação; verificar ausência de duplicidade.
11. Desligar checkbox; confirmar CTA oculto e link anterior inelegível para nova sessão.

## Quality gates
```bash
cd AB0-1-back
bundle exec rails zeitwerk:check
bundle exec rspec spec/services/review_collection spec/services/voice_reviews
cd ../AB0-1-front
npm run typecheck
npm test -- --runInBand components/company/ReviewWhatsAppButton.spec.tsx
```

## Rollback
Desmarcar `voice_review_cta_enabled` nas empresas afetadas.
Em emergência, desativar `VOICE_REVIEWS_ENABLED` no runtime e aplicar
o procedimento operacional de deploy seguro.
O rollback não apaga Review, Convite, Sessão ou Consentimento históricos.
