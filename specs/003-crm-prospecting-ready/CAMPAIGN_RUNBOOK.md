# Runbook — campanhas

## Antes de agendar ou lançar

- Confirme tenant, template ativo no tenant, sender e audience filter.
- Rode preflight e confira contagem elegível, inválidos/suprimidos/duplicados, provider status e blockers.
- O snapshot resolve destinatários no tenant e grava recipients; alterações posteriores no filtro não devem trocar a audiência do envio já snapshotado.
- Não habilite campanha comercial até passar E2E de staging e definir caps por campanha/tenant/dia.

## Estados

Campanha usa estados existentes `draft`, `scheduled`, `dispatching`, `paused`, `completed`, `failed`, `cancelled`. Pause/resume/cancel/retry usam `Dispatcher`; launch/schedule exigem preflight. Switch OFF impede dispatch.

## Incidente

Desligue `SALES_EMAIL_SENDING_ENABLED`, pause/cancele a campanha conforme estado, preserve job e recipient records e investigue `campaign_id`, `recipient_id`, `email_message_id`, `provider_message_id` e job id. Não reenfileire manualmente antes de confirmar se SES aceitou a mensagem; o estado local `sending` evita uma repetição cega, mas pode precisar de reconciliação.

## Gates não provados

Não foi completado envio real, evento SES, conclusão com métricas nem validação de double launch sob workers Redis reais. Fallback permissivo do lock quando Redis falha e quotas/rate limit ainda são pendências operacionais.
