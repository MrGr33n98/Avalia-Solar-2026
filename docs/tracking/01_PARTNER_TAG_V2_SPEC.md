# Especificação da Tag Parceira V2 — Consentimento, Atribuição e Privacidade

**Versão:** 2.0  
**Data:** 15 de Outubro de 2026  
**Status:** Implementado e Validado  
**Branch:** `feat/tracking-partner-consent-attribution-v2`  

---

## 1. Visão Geral da Arquitetura

A **Tag Parceira V2** do Avalia Solar conecta a jornada de descoberta do usuário no marketplace (perfil da empresa, comparador, calculadoras) com a experiência de conversão no site do parceiro credenciado. O sistema garante:
1. **Atribuição Verificável:** Registro auditável de cada clique de saída (`OutboundClick`) com assinatura HMAC-SHA256 (`as_click_id`).
2. **Isolamento Estrito Multi-Tenant:** Um token emitido para a Empresa A jamais pode ser atribuído à Empresa B, mesmo com assinatura matematicamente válida.
3. **Privacidade e Consentimento Real (LGPD):** A tag opera em modo *consent-aware* por padrão. Nenhum evento ou dado persistente é coletado ou transmitido sem base legal ou consentimento explícito.
4. **Resiliência e Não-Invasividade:** Falhas de rede, bloqueadores de anúncio (AdBlock) ou erros do navegador não quebram nem atrasam o carregamento da aplicação parceira.

---

## 2. Contrato do Token Assinado (`as_click_id`)

O redirecionamento via `/api/v1/outbound/redirect` gera o parâmetro de URL `?as_click_id=<payload_base64>.<hmac_sha256>`.

### Estrutura do Payload (JSON Decodificado)
```json
{
  "cid": 372,
  "src": "profile",
  "clk": "7a3b4c12-3456-4abc-9def-1234567890ab",
  "iat": 1729000000,
  "exp": 1731592000,
  "nonce": "a1b2c3d4e5f67890"
}
```

### Regras de Validação no Servidor
1. **Assinatura HMAC-SHA256:** Calculada com `Rails.application.secret_key_base`. Tokens adulterados são rejeitados silenciosamente na camada de atribuição (a sessão anônima é aceita, mas sem vínculo de clique).
2. **TTL (Time to Live):** 30 dias por padrão. Tokens com `exp < Time.current` têm a atribuição descartada.
3. **Fronteira Multi-Tenant:** O identificador `cid` do payload deve ser estritamente idêntico ao `company_id` da `Sales::TrackingSite` associada à chave pública `public_key`. Tentativas cross-tenant são bloqueadas e registradas em log de segurança.
4. **Validação de Registro Relacional:** O `clk` (UUID) é verificado contra a tabela `outbound_clicks`. A assinatura do token deve corresponder com exatidão à `click_token_signature` gravada no momento do clique.
5. **Hash Auditável:** O token bruto não é persistido nas sessões do banco; apenas seu hash SHA-256 (`as_click_id_hash`) de 64 caracteres.

---

## 3. Comportamento do Snippet no Navegador

### 3.1 Higienização da URL
Ao aterrissar no site parceiro, o snippet extrai `as_click_id` e imediatamente remove o parâmetro da barra de endereços via `window.history.replaceState` sem recarregar a página. Isso impede vazamento do token em compartilhamentos de link, bookmarks ou cabeçalhos `Referer` subsequentes.

### 3.2 Estados de Consentimento (LGPD)

| Estado | Comportamento do Snippet | Ação no Backend |
|---|---|---|
| **Pendente / Desconhecido** | Enfileira eventos em memória. Não grava em `sessionStorage` nem `localStorage`. | Se sessão for iniciada, registra `consent_state: 'unknown'` sem atribuição persistente. |
| **Concedido (`granted`)** | Dispara sessão atribuída, salva `session_id` em `sessionStorage`, processa fila e envia evento `consent_granted`. | Valida `as_click_id`, vincula `outbound_click_id`, define `consent_state: 'granted'`. |
| **Revogado / Negado (`denied`)** | Limpa `sessionStorage` e in-memory storage, envia `consent_revoked` e descarta qualquer novo evento. | Atualiza sessão para `consent_state: 'denied'`, descarta novos eventos de rastreamento. |

### 3.3 Integração com CMP / Gerenciadores de Consentimento
O parceiro pode integrar sua CMP de três maneiras:

1. **Via Chamada JS:**
   ```javascript
   window.avaliaTrack.grantConsent({ source: 'onetrust' });
   // Para revogar:
   window.avaliaTrack.revokeConsent();
   ```

2. **Via Variável Global (`window.avaliaConsent`):**
   ```javascript
   window.avaliaConsent = { analytics: true };
   ```

3. **Via Google Consent Mode v2:**
   O snippet detecta nativamente `window.google_tag_data.ics.entries.analytics_storage.status === 'granted'`.

---

## 4. Proteção contra Captura de PII em Formulários

O listener de submissão de formulários da Tag V2 registra estritamente o evento de envio com identificadores estruturais (`form_id`), **sem nunca ler nem trafegar**:
- Valores de campos (`input.value`)
- Senhas, tokens ou dados de cartão
- E-mails, nomes ou números de telefone
- Conteúdo de `FormData`

No backend, `Sales::Tracking::PropertiesSanitizer` aplica filtro regex rejeitando qualquer chave contendo `email`, `phone`, `name`, `token`, `password`, `secret`, `authorization`.

---

## 5. Procedimento de Rollback Seguro

Se a Tag V2 precisar ser revertida:
1. `ENV['TRACK_PROSPECTS_ENABLED'] = 'false'` desativa imediatamente o enriquecimento com `as_click_id` no endpoint `/api/v1/outbound/redirect`, retornando ao comportamento de redirecionamento direto 302.
2. A migração `20261015100000_add_outbound_click_and_consent_to_sales_tracking_sessions.rb` é 100% reversível (`rails db:rollback`).
3. O endpoint da tag continua respondendo com chave pública sem quebrar clientes legados.
