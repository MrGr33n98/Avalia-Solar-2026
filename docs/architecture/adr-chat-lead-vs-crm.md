# ADR — ChatLead versus CRM

## Decisão

`ChatLead` representa a captura originada no chat. A plataforma é responsável por captura, qualificação, roteamento, entrega e atribuição. Ela não é um CRM comercial completo.

A empresa só é atribuída quando existe ação explícita do usuário, atualmente `quote_requested_company_id`. Empresas apenas recomendadas não recebem o lead automaticamente.

## Estados de destino

- `recommended`: apresentada pelo mecanismo de recomendação;
- `clicked`: interação registrada;
- `selected`: empresa escolhida;
- `consented`: usuário autorizou o contato;
- `assigned`: `assigned_company_id` preenchido;
- `delivered`: envio confirmado ao destino.

`ChatLead#assignment_source` registra a causa da atribuição (`explicit_quote`, `explicit_company_selection`, `marketplace_distribution` ou `manual`). A ausência de empresa é válida e permite roteamento posterior.

## Consequências

O CRM externo permanece uma integração de entrega (`CRMWebhookDispatchJob`), não a fonte de verdade da captura. A evolução futura deve adicionar estados/eventos sem converter `ChatLead` em pipeline CRM.
