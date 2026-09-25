# Runbook — cadências

## Funcionamento implementado

`EmailSequence`/`EmailSequenceStep` definem a cadência. Enrollment separado guarda tenant, contato, conta, oportunidade, owner, status, etapa e próxima ação. Scheduler roda a cada minuto. Passos `email`, `task` e `call_task` são suportados; tarefa aparece no CRM com owner e ligação à execução.

O envio usa template tenant-scoped, `SendEmailJob` e suppression reavaliada no momento do envio. Falha não avança etapa; há retry limitado a três tentativas com intervalo de cinco minutos. Switch desligado pausa enrollment preservando a execução. Conclusão de task avança a sequência.

## Controles

Use a tela `/dashboard/sales/campaigns/sequences` para criar uma definição com template ativo, incluir contato por ID e pausar/retomar/parar enrollment. A API valida tenant e visibilidade do owner/equipe.

## Stops e limitações

Unsubscribe, hard bounce/complaint, suppression, manual stop e opportunity won/lost são conectados à interrupção. O processor reconhece EmailEvent `replied`, mas não foi localizada nem exercitada uma integração inbound que crie esse evento: stop por reply **não operacional/comprovado**.

Antes de editar enrollment manualmente, confira a mensagem/tarefa vinculada e motivo do stop. Não apague histórico operacional.
