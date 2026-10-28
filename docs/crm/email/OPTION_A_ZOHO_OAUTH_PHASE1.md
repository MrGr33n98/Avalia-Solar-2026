# CRM Sales Inbox — Opção A / Fase 1: conexão Zoho Mail (2026-10-27)

## Escopo desta PR

Esta PR implementa exclusivamente a **conexão OAuth 2.0 de uma caixa existente do Zoho**. Não altera MX/DNS, não desvia e-mails existentes, não habilita importação, leitura de corpo de mensagens, envio, regras de distribuição nem conexão Gmail/Outlook. O envio AWS SES permanece inalterado.

### UI

- `/dashboard/sales/settings/email/accounts`: lista contas do usuário e botão **Conectar Zoho Mail**.
- O botão solicita um URL de autorização ao backend; o usuário autoriza no provedor; o callback finaliza e retorna à página de configurações.
- Estados vazios e erros reais, nunca dados de exemplo.
- **Não tratar `sync_status: idle` como prova de sincronização ativa.**

### API

- `GET /api/v1/sales/email_connections`: `{ accounts: [{ id, email, provider, sync_status, last_synced_at }] }`, sem tokens.
- `POST /api/v1/sales/email_connections/zoho/authorize`: `{authorization_url}`, requer sessão CRM autorizada e company_id.
- `GET /api/v1/sales/email_connections/zoho/callback`: recebe `code` e `state` do Zoho, valida estado com TTL, resgata conta com OAuth, guarda tokens criptografados e redireciona a URL fixa da configuração.

### Ambiente

Em **staging**, cadastrar uma aplicação do tipo **Server-based** no Zoho API Console do datacenter adequado e configurar:

```env
ZOHO_MAIL_REGION=us
ZOHO_MAIL_CLIENT_ID=<secret-manager>
ZOHO_MAIL_CLIENT_SECRET=<secret-manager>
ZOHO_MAIL_REDIRECT_URI=https://api.avaliasolar.com.br/api/v1/sales/email_connections/zoho/callback
```

**ATENÇÃO**: o callback desta fase está fixo no host `api.avaliasolar.com.br` e o retorno está fixo no `crm.avaliasolar.com.br`. Para homologar num domínio de staging, alterar a configuração de hosts permitidos de maneira explícita antes de executar. Não utilizar a URL de produção em testes de staging.

Nunca commitar client secret, refresh token, authorization code nem parâmetros de autenticação. Certificar-se de que `Rails.cache` é distribuído/persistente em ambiente com múltiplas réplicas; o estado tem validade de 10 minutos. O servidor usa segredo da aplicação para criptografar tokens no repouso; preservar e proteger o segredo da aplicação e providenciar estratégia de rotação.

### Scopes OAuth (somente leitura nesta fase)

`ZohoMail.accounts.READ,ZohoMail.messages.READ,ZohoMail.folders.READ`.

Não solicitar envio na primeira fase. Antes de suportar reply, ampliar scopes com consentimento explícito, sem reaproveitar tokens de permissão insuficiente.

### Cuidado com domínios regionais

A seleção de datacenter é por `ZOHO_MAIL_REGION` usando allowlist. Confirmar o datacenter da conta com o proprietário. A compatibilidade de outros datacenters além dos listados precisa ser adicionada explicitamente, jamais construir URL a partir de parâmetro externo.

### GAP / futuras fases

| Fase | Status nesta PR | Obrigação antes de produção |
| --- | --- | --- |
| OAuth Zoho | Código proposto | Homologar com caixa de teste |
| Gmail OAuth | Não implementado | Consentimento e Google APIs |
| Microsoft OAuth | Não implementado | Microsoft Graph + consentimento |
| Recebimento/sync incremental | Não implementado | Cursor, dedup, retry/backoff, reconciliação |
| Threads bidirecionais | Não implementado | In-Reply-To, References e IDs do provedor |
| Responder via Zoho | Não implementado | Scope de envio e send adapter |
| Inbox compartilhada | Não implementado | ACL por mailbox e auditoria |
| Regras de roteamento | Não implementado | Persistência e logs |
| AI / classificação | Não implementado | Opt-in, privacidade e revisão humana |
| Desconexão e revogação | Não implementado | Revoke + expurgo de tokens + retenção |

### Critérios de aceite mínimos

1. Sem login, endpoints de listagem e autorização são bloqueados.
2. State de callback ausente, expirado ou reutilizado não conecta a conta.
3. OAuth negado redireciona para um estado de erro seguro, sem vazar código/token.
4. Apenas usuário interno autorizado pode conectar e listar suas próprias contas.
5. Erro de credencial não retorna URL falsa.
6. Após consentimento real, a conta aparece sem tokens no JSON da API.
7. E-mails enviados atualmente pelo SES continuam funcionando.
8. Não existir sincronização ou envio implícito durante a conexão.
9. Ambiente de staging usar callbacks próprios e testes de integração antes de qualquer merge/deploy.
10. Não prometer OAuth Gmail/Outlook ou Inbox bidirecional nessa fase.

### Alertas identificados na auditoria AS-IS

- `EmailCenterPage.tsx` chama "Entrada" um filtro que atualmente inclui todas as mensagens. Não significa recebimento bidirecional.
- `sales_email_accounts` já inclui provider e colunas de tokens; esta PR não cria tabela duplicada.
- `sales_email_threads`, `sales_email_messages`, `sales_email_participants`, `sales_email_attachments` já existem.
- Conta compartilhada e conta individual têm permissões distintas; a PR introduz apenas a segunda.
- Backend de envio atual utiliza `SendEmailJob` e SES; essa PR não modifica seu fluxo.

## Documentação do provedor

- https://www.zoho.com/mail/help/api/using-oauth-2.html
- https://github.com/zoho/zohomail-oas

## Validação

Nenhum teste conectado com Zoho executado nesta PR. CI / testes Rails e a configuração OAuth real deverão ser verificados no PR antes de merge.
