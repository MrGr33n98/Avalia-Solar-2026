# Security Testing Checklist - Stripe Subscriptions

## Status

Checklist para a fase SaaS de billing. O hotfix de webhook Stripe legado ja foi aplicado, mas cobranca recorrente ainda nao deve ir para producao sem os testes abaixo.

---

## Webhook Security

- [ ] Webhook SaaS usa `Stripe::Webhook.construct_event`.
- [ ] Header invalido retorna `401`.
- [ ] Payload adulterado retorna `401`.
- [ ] Secret ausente retorna erro de configuracao sem expor segredo.
- [ ] Eventos nao reconhecidos sao logados e ignorados.
- [ ] Processamento e idempotente por `event.id` ou Stripe object id.
- [ ] Logs incluem event id, tipo, provider e timestamp.
- [ ] Logs nao incluem API keys, webhook secret ou PII desnecessaria.

Eventos minimos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Checkout E Pagamento

- [ ] Checkout SaaS usa novo `Billing::CheckoutService`.
- [ ] Checkout SaaS usa `mode: 'subscription'`.
- [ ] Checkout legado de banner permanece em `Payment::CheckoutService` com `mode: 'payment'`.
- [ ] Todo create de checkout recorrente usa idempotency key.
- [ ] `price_id` vem do plano salvo no backend, nao do frontend.
- [ ] Plano Enterprise nao cria checkout automatico se for fluxo comercial.
- [ ] Nenhum dado de cartao e armazenado localmente.

---

## Authentication E Authorization

- [ ] Criar checkout exige usuario autenticado.
- [ ] Usuario so cria checkout para a propria empresa.
- [ ] Customer Portal exige assinatura existente da propria empresa.
- [ ] Admin pode auditar, mas nao expor Stripe IDs sensiveis em respostas publicas.
- [ ] Requests sem token retornam `401`.
- [ ] Requests de outra empresa retornam `403`.

---

## Data Integrity

- [ ] `plans.slug` tem indice unico.
- [ ] `company_subscriptions.stripe_subscription_id` tem indice unico.
- [ ] `company_subscriptions.stripe_customer_id` tem indice adequado.
- [ ] Retry de webhook nao duplica assinatura.
- [ ] Cancelamento atualiza status sem apagar historico.
- [ ] Falha de pagamento marca `past_due` ou status equivalente.
- [ ] Periodos `current_period_start` e `current_period_end` sao persistidos.

---

## API Security

- [ ] Rate limit no checkout por usuario.
- [ ] Rate limit no Customer Portal por usuario.
- [ ] Rate limit ou protecao equivalente no webhook.
- [ ] CORS permite somente origens configuradas.
- [ ] HTTPS obrigatorio em producao.
- [ ] Erros de producao sao genericos.
- [ ] Erros detalhados ficam apenas em logs internos.

---

## E2E Em Stripe Test Mode

- [ ] Usuario seleciona Pro em `/pricing`.
- [ ] Backend cria Checkout Session de assinatura.
- [ ] Stripe redireciona para success URL.
- [ ] Webhook cria/atualiza `CompanySubscription`.
- [ ] Dashboard mostra plano atual.
- [ ] Customer Portal abre para a assinatura.
- [ ] Cancelamento no portal reflete no backend via webhook.
- [ ] Pagamento falho atualiza status e nao ativa recursos pagos indevidamente.

---

## Sign-Off Antes De Live Mode

- [ ] Hotfix legado validado em staging.
- [ ] Billing SaaS validado em Stripe test mode.
- [ ] Todas as migrations aplicadas em staging.
- [ ] ENV vars revisadas.
- [ ] Webhook endpoint configurado no Stripe Dashboard.
- [ ] Rollback documentado.
- [ ] Monitoramento de erros e eventos habilitado.
- [ ] Revisao de seguranca concluida.
