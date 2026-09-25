# Contratos REST Sales

Rotas são definidas em `AB0-1-back/config/routes.rb`; controller/model continuam sendo a fonte de verdade. Requests autenticados retornam `401` sem identidade, `403` sem acesso à superfície Sales, `404` para IDs fora do escopo e `422` para referências incompatíveis ou preflight bloqueado.

## Contratos verificados nesta implementação

| Operação | Contrato |
| --- | --- |
| `POST /api/v1/sales/consent_revocations` | Mapeia para `ConsentRevocationsController#update`; consent é resolvido dentro do tenant e repetição é idempotente. |
| `GET /api/v1/sales/today` | Fila do usuário atual por padrão; escopo de equipe depende da permissão do tenant. |
| `POST /api/v1/sales/email_sequence_enrollments` | Payload `{ enrollment: { sequence_id, contact_id, opportunity_id? } }`; sequence/contact/opportunity são resolvidos no tenant. Reenrollment ativo/pausado retorna enrollment existente. |
| `POST /api/v1/sales/email_sequence_enrollments/:id/{pause,resume,stop}` | Transições persistidas e auditadas; só owner ou permissionamento de equipe vê enrollment. |
| `GET /api/v1/sales/forms/:public_key` | Resolve formulário ativo pela chave pública opaca, sem expor ID interno; form sem tenant/campaign compatível não fica público. |
| `POST /api/v1/sales/forms/:public_key/submit` | Aceita somente campos configurados, payload ≤16 KB, scalar ≤2 KB, throttle Rack::Attack, campaign herdada do form e dedupe por `Idempotency-Key` ou hash do payload. Não aceita IDs internos e ainda não converte submission em lead. |
| `GET/POST/PUT /api/v1/sales/tracking_sites` | Requer permissão `settings.manage`; lê/cria/atualiza somente o site do `current_user.company_id`; recebe origens exatas e devolve chave/snippet opacos do tenant. |
| `POST /api/v1/sales/tracking_sites/:id/rotate_key` | Rotaciona chave do tenant atual; chave anterior deixa de resolver site. O ID de rota não escolhe o tenant. |
| `GET /api/v1/public/sales/tracking/:public_key.js` | Serve script do tenant somente quando `Origin`/`Referer` corresponde a uma origem salva. Script registra page_view e submit de form sem enviar campos. |
| `POST /api/v1/public/sales/tracking/:public_key/sessions` | CORS/origin allowlisted; cria IDs de sessão/visitor no servidor; aceita landing path e UTM filtrada; não aceita account/contact/company IDs. |
| `POST /api/v1/public/sales/tracking/:public_key/events` | CORS/origin allowlisted; aceita somente eventos web, UUID por sessão, path sem query e properties sanitizadas; replay do mesmo UUID retorna duplicate sem nova linha. |
| `OPTIONS /api/v1/public/sales/tracking/:public_key/{sessions,events}` | Rack::Cors consulta a chave ativa e allowlist no banco para retornar CORS dinâmico exato, sem wildcard. |
| `POST /api/v1/sales/tracking_identity` | Exige autenticação Sales; session é resolvida por company/account scope e Contact pelo tenant; então session/eventos anônimos são associados ao Contact. |
| `POST /api/v1/sales/email_events/provider` | Usa o handler SES/SNS verificado por assinatura e topic ARN; endpoint legado não aceita token estático como autenticação SNS. |
| `GET /t/email/unsubscribe/:token` | Mostra confirmação sem alterar consent/suppression. |
| `POST /t/email/unsubscribe/:token` | Verifica token assinado com propósito e expiração; registra suppression e interrompe cadência. |

## Erros

O helper REST devolve `{ "code": "...", "message": "...", "details": ..., "error": { "code": "...", "message": "...", "details": ... } }`. A forma aninhada atende clientes CRM; campos planos são preservados por compatibilidade com clientes existentes.

## Limites ainda abertos

Tracking web anônimo está implementado e coberto por request specs, mas não validado em browser/staging. Form público tem fluxo separado e não cria Lead. Não foi comprovado contrato inbound para resposta de email, nem attribution de conversões first/last touch. Throttle Rack::Attack atual usa MemoryStore e não é distribuído entre réplicas.
