# Dossie do Chat P2P Avalia Solar

Ultima atualizacao: 2026-06-18

## Resumo executivo

O chat P2P e o canal de conversa direta entre usuarios compradores cadastrados e empresas do marketplace. Ele e diferente do chatbot/assistente de leads: aqui existe uma conversa persistida em banco, vinculada a uma empresa e a um usuario, com mensagens diretas e atualizacao em tempo real via ActionCable.

O recurso esta protegido por duas camadas:

1. Plano da empresa precisa liberar a feature `p2p_chat`.
2. A empresa precisa estar com `p2p_chat_enabled = true` no Active Admin.

No frontend, o chat aparece como CTA publico apenas quando a empresa pode usar o recurso e o visitante esta autenticado como usuario comprador (`role === 'review'`). O dashboard da empresa tem uma aba de Atendimento com status, canais ativos e inbox de conversas.

## O que existe hoje

### Backend Rails

Arquivos principais:

- `AB0-1-back/app/models/plan_feature_catalog.rb`
- `AB0-1-back/app/controllers/concerns/feature_gate_enforceable.rb`
- `AB0-1-back/app/controllers/api/v1/conversations_controller.rb`
- `AB0-1-back/app/controllers/api/v1/direct_messages_controller.rb`
- `AB0-1-back/app/models/conversation.rb`
- `AB0-1-back/app/models/direct_message.rb`
- `AB0-1-back/app/channels/conversation_channel.rb`
- `AB0-1-back/app/admin/companies.rb`
- `AB0-1-back/db/migrate/20260616023738_add_p2p_chat_enabled_to_companies.rb`
- `AB0-1-back/db/migrate/20260616023808_create_conversations.rb`
- `AB0-1-back/db/migrate/20260616023840_create_direct_messages.rb`

### Frontend Next.js

Arquivos principais:

- `AB0-1-front/lib/api.ts`
- `AB0-1-front/app/chat/page.tsx`
- `AB0-1-front/app/chat/ChatClient.tsx`
- `AB0-1-front/app/dashboard/components/CompanyChatInbox.tsx`
- `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyHero.tsx`
- `AB0-1-front/components/CompanyCard.tsx`
- `AB0-1-front/components/navigation/MobileBottomNav.tsx`
- `AB0-1-front/lib/pricing/catalog.ts`

## Modelo de dados

### `companies.p2p_chat_enabled`

Campo booleano criado por:

```ruby
add_column :companies, :p2p_chat_enabled, :boolean, default: false, null: false
```

Uso:

- `false`: empresa nao pode receber chat, mesmo se o plano permitir.
- `true`: empresa pode receber chat se o plano tambem liberar `p2p_chat`.

### `conversations`

Tabela:

- `user_id`
- `company_id`
- `created_at`
- `updated_at`

Modelo:

```ruby
class Conversation < ApplicationRecord
  belongs_to :user
  belongs_to :company
  has_many :direct_messages, dependent: :destroy

  validates :user_id, uniqueness: { scope: :company_id }
end
```

Regra: existe no maximo uma conversa por par `usuario comprador + empresa`.

### `direct_messages`

Tabela:

- `conversation_id`
- `body`
- `sender_type`
- `read_at`
- `created_at`
- `updated_at`

Modelo:

```ruby
class DirectMessage < ApplicationRecord
  belongs_to :conversation

  validates :body, presence: true
  validates :sender_type, inclusion: { in: %w[User Company] }
end
```

`sender_type` hoje aceita:

- `User`: mensagem enviada pelo comprador.
- `Company`: mensagem enviada pela empresa.

## Feature gate e planos

A feature esta definida no catalogo:

```ruby
'p2p_chat' => {
  label: 'Chat direto com clientes',
  description: 'Habilita conversas diretas entre compradores e a empresa pelo marketplace.',
  type: :boolean,
  default: false,
  access_behavior: :entitlement,
  teaser: :locked,
  group: 'conversion',
  aliases: %w[p2p_chat_enabled direct_chat customer_chat marketplace_chat]
}
```

Status por plano:

| Plano | `p2p_chat` |
|---|---:|
| Free | bloqueado por default |
| Essential | `false` |
| Pro | `true` |
| Enterprise | `true` |

O backend usa `FeatureGateEnforceable#enforce_feature_access!`. Se a feature nao estiver com `state == 'enabled'`, a API retorna `403` com payload semelhante a:

```json
{
  "code": "P2P_CHAT_NOT_AVAILABLE",
  "error": "Feature not available in your plan",
  "feature": "p2p_chat",
  "reason": "upgrade_required",
  "plan": "free",
  "suggestion": "Upgrade your plan to unlock this feature"
}
```

## Active Admin

O campo esta permitido em `permit_params` de `app/admin/companies.rb`:

```ruby
:active_admin, :p2p_chat_enabled, :seo_title, :meta_description
```

No formulario da empresa:

```ruby
f.input :p2p_chat_enabled, as: :boolean, label: 'Habilitar Chat com Clientes (estilo OLX)'
```

Checklist no Active Admin:

- Empresa precisa estar em plano Pro ou Enterprise, ou ter feature access equivalente com `p2p_chat` habilitado.
- Campo `p2p_chat_enabled` precisa estar marcado.
- Empresa precisa estar ativa/publicavel para aparecer nas telas publicas.
- Se houver cache de payload da empresa, invalidar/recarregar apos alteracao.

## Endpoints Rails

Rotas:

```ruby
resources :conversations, only: %i[index create] do
  resources :direct_messages, only: %i[index create]
end
```

### Listar conversas

`GET /api/v1/conversations`

Requer login.

Comportamento:

- Se `current_user.company_user? && current_user.company_id`, lista conversas da empresa.
- Caso contrario, lista conversas do usuario comprador.

Resposta contem:

- `id`
- `user_id`
- `company_id`
- `created_at`
- `user_name`
- `company_name`
- `company_logo`
- `company_avatar`
- `last_message`

### Criar conversa

`POST /api/v1/conversations`

Body:

```json
{
  "company_id": 123
}
```

Regras atuais:

1. Usuario precisa estar autenticado.
2. Usuario precisa ser comprador (`current_user.review_user?`).
3. Empresa precisa existir.
4. Empresa precisa ter `p2p_chat_enabled = true`.
5. Plano/feature access da empresa precisa liberar `p2p_chat`.
6. A conversa e criada ou reutilizada por `find_or_create_by(user_id, company_id)`.

Erros esperados:

- `403 Only buyer users can start direct chats`
- `404 Company not found`
- `403 Chat is disabled for this company`
- `403 P2P_CHAT_NOT_AVAILABLE`

### Listar mensagens

`GET /api/v1/conversations/:conversation_id/direct_messages`

Regras:

- Usuario autenticado.
- Conversa precisa existir.
- Usuario precisa ser:
  - o comprador dono da conversa;
  - usuario empresa da empresa da conversa;
  - admin.

### Enviar mensagem

`POST /api/v1/conversations/:conversation_id/direct_messages`

Body:

```json
{
  "body": "Mensagem do cliente ou da empresa"
}
```

Regras:

1. Usuario autenticado.
2. Usuario precisa ter acesso a conversa.
3. Empresa precisa manter `p2p_chat_enabled = true`.
4. Plano/feature access precisa manter `p2p_chat` habilitado.
5. `sender_type` e definido automaticamente:
   - `Company` se `current_user.company_user?`
   - `User` caso contrario.

Ao salvar, o backend faz broadcast:

```ruby
ActionCable.server.broadcast(
  "conversation:#{@conversation.id}",
  message_json(message)
)
```

## ActionCable

Canal:

```ruby
class ConversationChannel < ApplicationCable::Channel
```

Assinatura:

```js
{ channel: 'ConversationChannel', conversation_id: conversationId }
```

Regras:

- Rejeita se nao houver `current_user`.
- Rejeita se a conversa nao existir.
- Aceita apenas:
  - comprador dono;
  - usuario empresa da empresa;
  - admin.

Stream:

```ruby
stream_from "conversation:#{@conversation.id}"
```

Observacao importante: o `ChatClient` cria o consumer com:

```ts
const wsUrl = getApiBaseUrl().replace('http', 'ws').replace('/api/v1', '/cable');
createConsumer(wsUrl);
```

Isso depende do browser enviar os cookies da sessao no handshake WebSocket. Se a autenticacao em producao estiver baseada apenas em bearer token/localStorage e nao em cookie acessivel ao Rails ActionCable, a conexao pode ser rejeitada mesmo com a API HTTP funcionando.

## Frontend: API client

Em `AB0-1-front/lib/api.ts`:

```ts
export const conversationsApi = {
  getAll: () => fetchApi<Conversation[]>('/conversations'),
  create: (companyId: number) =>
    fetchApi<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId }),
    }),
  getMessages: (conversationId: number) =>
    fetchApi<DirectMessage[]>(`/conversations/${conversationId}/direct_messages`),
  sendMessage: (conversationId: number, body: string) =>
    fetchApi<DirectMessage>(`/conversations/${conversationId}/direct_messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
};
```

Tipos relevantes:

- `Conversation`
- `DirectMessage`
- `Company.p2p_chat_enabled`

## Frontend: pagina `/chat`

Arquivo:

- `AB0-1-front/app/chat/ChatClient.tsx`

Fluxo:

1. Aguarda AuthContext carregar.
2. Se nao estiver autenticado, redireciona para `/login`.
3. Se o usuario nao tiver `role === 'review'`, mostra erro: `O chat com empresas está disponível apenas para usuários compradores.`
4. Carrega `GET /conversations`.
5. Se a URL tiver `?company_id=ID`, tenta encontrar conversa existente.
6. Se nao existir, chama `POST /conversations`.
7. Seleciona conversa, carrega mensagens e assina ActionCable.
8. Envio de mensagem usa `POST /direct_messages`.

Tratamento de erro:

- `401`: pede login.
- `403 P2P_CHAT_NOT_AVAILABLE`: informa plano bloqueado.
- `403 Chat is disabled`: informa chat desativado.
- fallback: erro generico.

## Frontend: CTA na pagina da empresa

Arquivo:

- `AB0-1-front/app/companies/[id]/components/CompanyHero.tsx`

Condicoes:

```ts
const canUseBuyerChat = isAuthenticated && user?.role === 'review';
const directChatAvailable =
  company.p2p_chat_enabled === true &&
  (!company.feature_access || isFeatureEnabled(company.feature_access, 'p2p_chat'));
const directChatEnabled = directChatAvailable && canUseBuyerChat;
```

UI:

- Mostra pill `Online` quando `directChatAvailable`.
- Mostra botao `Chat Direto` quando `directChatEnabled`.
- Clique navega para `/chat?company_id=${company.id}`.

Observacao: visitante deslogado nao ve o botao direto. A jornada atual exige login/cadastro como usuario comprador para conversar.

## Frontend: CTA no card de empresa

Arquivo:

- `AB0-1-front/components/CompanyCard.tsx`

Condicoes:

```ts
const directChatAvailable =
  company.p2p_chat_enabled === true &&
  (!company.feature_access || isFeatureEnabled(company.feature_access, 'p2p_chat'));
const directChatEnabled = directChatAvailable && canUseBuyerChat;
```

Prioridade atual do CTA:

1. WhatsApp, se existir e estiver habilitado.
2. Chat direto, se habilitado e usuario comprador logado.
3. Orçamento/lead wizard, se aplicavel.

Clique do chat:

```ts
router.push(`/chat?company_id=${id}`);
```

## Frontend: dashboard da empresa

Arquivos:

- `AB0-1-front/app/dashboard/components/EnterpriseDashboard.tsx`
- `AB0-1-front/app/dashboard/components/CompanyChatInbox.tsx`

A aba `chat` esta ligada a feature:

```ts
chat: 'p2p_chat'
```

Na aba Atendimento:

- Status do painel: online/offline via `navigator.onLine`.
- Status do chat direto:
  - `Ativo` quando `p2p_chat_enabled` e feature access permitem.
  - `Nao configurado` caso contrario.
- Status do WhatsApp.
- Card de disponibilidade no perfil.
- Inbox de conversas com lista, mensagens e resposta.

O `CompanyChatInbox`:

- Se `enabled === false`, mostra card explicando que o chat direto esta desativado.
- Se `enabled === true`, chama `conversationsApi.getAll()`.
- Ao selecionar conversa, chama `getMessages`.
- Ao responder, chama `sendMessage`.

Limitacao atual: o inbox do dashboard atualiza por chamadas HTTP, mas nao assina o `ConversationChannel` em tempo real. A atualizacao em tempo real esta implementada no `/chat` do comprador.

## Frontend: mobile bottom nav

Arquivo:

- `AB0-1-front/components/navigation/MobileBottomNav.tsx`

Itens atuais:

- Inicio
- Empresas
- Chat
- Favoritos
- Perfil

O item `Chat` aponta para `/chat` e tem um ponto verde visual (`chat-online`). Atualmente esse ponto e estatico; ele nao consulta presenca real de empresas ou conversas nao lidas.

## Pricing frontend

Arquivo:

- `AB0-1-front/lib/pricing/catalog.ts`

Existe entrada `p2p_chat` no catalogo comercial com label `Chat direto com clientes`, mantendo alinhamento entre planos, UI e backend.

## Diferenca entre Chat P2P e chatbot/lead wizard

Existem outros modulos de chat no repositorio:

- `components/chat/ChatWidget.tsx`
- `app/controllers/api/v1/chat/*`
- services em `app/services/chat/*`
- tabelas `chat_sessions`, `chat_messages`, `chat_leads`, `chat_insights`

Esses compoem o chat assistente/qualificacao/recomendacao de empresas. Nao sao a mesma coisa que o P2P.

P2P usa:

- `conversations`
- `direct_messages`
- `ConversationChannel`
- `/api/v1/conversations`
- `/api/v1/conversations/:id/direct_messages`

## Fluxo ideal de ponta a ponta

### Cliente comprador

1. Usuario acessa uma empresa.
2. Sistema verifica se a empresa tem chat disponivel.
3. Usuario comprador logado ve `Chat Direto`.
4. Clique abre `/chat?company_id=ID`.
5. Frontend cria ou reutiliza conversa.
6. Usuario envia mensagem.
7. Backend salva `direct_message` com `sender_type = User`.
8. Backend transmite via ActionCable.
9. Empresa ve a conversa no dashboard e responde.

### Empresa

1. Empresa acessa dashboard.
2. Aba Atendimento mostra status de canais.
3. Inbox carrega conversas da empresa.
4. Empresa seleciona conversa.
5. Empresa responde.
6. Backend salva `direct_message` com `sender_type = Company`.
7. Cliente recebe via ActionCable se estiver com `/chat` aberto.

## Checklist de habilitacao em producao

Para uma empresa aparecer com chat:

- [ ] Migracao `add_p2p_chat_enabled_to_companies` aplicada.
- [ ] Migracoes `create_conversations` e `create_direct_messages` aplicadas.
- [ ] Empresa com plano Pro ou Enterprise, ou feature access efetivo com `p2p_chat` enabled.
- [ ] Empresa com `p2p_chat_enabled = true`.
- [ ] API publica de empresa retornando `p2p_chat_enabled: true`.
- [ ] API publica de empresa retornando `feature_access.p2p_chat.state = enabled`.
- [ ] Usuario comprador criado com role `review`.
- [ ] Usuario comprador autenticado no frontend.
- [ ] `POST /api/v1/conversations` retorna `200`.
- [ ] `GET /api/v1/conversations/:id/direct_messages` retorna `200`.
- [ ] `POST /api/v1/conversations/:id/direct_messages` retorna `201`.
- [ ] ActionCable `/cable` aceitando autenticacao.
- [ ] Nginx/proxy liberando WebSocket Upgrade.

## Comandos uteis de debug

### Ver empresa no Rails console

```bash
docker exec -it ab0-backend bundle exec rails runner "c = Company.find_by(slug: 'voltalia-brasil') || Company.find_by(id: ENV['COMPANY_ID']); puts({id: c&.id, name: c&.name, tier: c&.inferred_plan_tier, p2p: c&.p2p_chat_enabled, feature: c&.feature_access&.dig('p2p_chat')}.inspect)"
```

### Ativar chat para uma empresa especifica

```bash
docker exec -it ab0-backend bundle exec rails runner "c = Company.find_by!(slug: 'voltalia-brasil'); c.update!(p2p_chat_enabled: true); puts c.reload.p2p_chat_enabled"
```

### Validar plano/feature access

```bash
docker exec -it ab0-backend bundle exec rails runner "c = Company.find_by!(slug: 'voltalia-brasil'); puts c.feature_access['p2p_chat'].inspect; puts c.inferred_plan_tier"
```

### Criar usuario comprador de teste

Existe script:

```bash
docker exec -it ab0-backend bundle exec rails runner scripts/create_review_chat_test_user.rb
```

Credenciais documentadas no script:

- Email: `review.chat.teste@avaliasolar.com.br`
- Senha: `ReviewChat@123`
- Role: `review`

### Ver ultimas conversas

```bash
docker exec -it ab0-backend bundle exec rails runner "Conversation.order(created_at: :desc).limit(10).includes(:user, :company).each { |c| puts({id: c.id, user: c.user&.email, company: c.company&.name, last: c.direct_messages.order(created_at: :desc).first&.body}.inspect) }"
```

### Ver mensagens de uma conversa

```bash
docker exec -it ab0-backend bundle exec rails runner "conv = Conversation.find(ENV.fetch('CONVERSATION_ID')); conv.direct_messages.order(:created_at).each { |m| puts \"[#{m.sender_type}] #{m.body}\" }"
```

### Logs de bloqueio por feature gate

Procurar por:

```text
[FeatureGate] blocked user_id=... company_id=... feature=p2p_chat reason=...
```

## Pontos provaveis de falha

### Empresa esta com plano sem `p2p_chat`

Sintoma:

- Botao nao aparece no frontend.
- API retorna `P2P_CHAT_NOT_AVAILABLE`.

Solucao:

- Ajustar plano para Pro/Enterprise.
- Conferir `company.feature_access['p2p_chat']`.

### `p2p_chat_enabled` falso no Active Admin

Sintoma:

- API retorna `Chat is disabled for this company`.
- Dashboard mostra `Chat direto: Nao configurado`.

Solucao:

- Marcar o campo no Active Admin.
- Confirmar no Rails console.

### Usuario nao e comprador (`role !== 'review'`)

Sintoma:

- `/chat` mostra erro de permissao.
- `POST /conversations` retorna `Only buyer users can start direct chats`.

Solucao:

- Usar usuario `review`.
- Criar usuario de teste pelo script.

### ActionCable rejeitado

Sintoma:

- Mensagem salva via HTTP, mas tempo real nao chega.
- Console mostra `[P2PChat] ActionCable rejected`.

Causas possiveis:

- Cookie nao enviado no WebSocket.
- Proxy/Nginx sem headers de Upgrade.
- `ACTION_CABLE_URL` incorreto.
- Origem nao permitida em `config.action_cable.allowed_request_origins`.

Solucao:

- Conferir `/cable` via DevTools > Network > WS.
- Conferir env `ACTION_CABLE_URL`.
- Conferir cookies/autenticacao.
- Ajustar proxy para WebSocket.

### Frontend sem payload atualizado

Sintoma:

- Active Admin mostra chat ligado, mas UI publica nao mostra.

Causas:

- API de empresas nao retorna `p2p_chat_enabled`.
- API retorna `feature_access` antigo.
- Cache do frontend/browser/CDN.

Solucao:

- Inspecionar resposta da API de empresa.
- Rebuild/redeploy frontend.
- Limpar cache se aplicavel.

## Pendencias e melhorias recomendadas

1. Adicionar ActionCable tambem no `CompanyChatInbox`, para a empresa receber mensagens em tempo real no dashboard.
2. Implementar contador de nao lidas e `read_at`.
3. Trocar o ponto verde estatico da bottom nav por estado real: conversas nao lidas ou empresas online.
4. Criar presenca real da empresa online, em vez de usar apenas `navigator.onLine`.
5. Criar pagina ou area de configuracao no dashboard para ligar/desligar chat se o plano permitir.
6. Melhorar fallback para usuario deslogado: mostrar CTA de login/cadastro e retorno para `/chat?company_id=ID`.
7. Adicionar testes de request para:
   - comprador cria conversa;
   - empresa nao cria conversa do lado comprador;
   - plano bloqueado retorna 403;
   - `p2p_chat_enabled=false` retorna 403;
   - empresa responde conversa da propria empresa;
   - empresa nao acessa conversa de outra empresa.
8. Adicionar teste E2E web:
   - login comprador;
   - abrir empresa com chat;
   - iniciar conversa;
   - enviar mensagem;
   - login empresa;
   - responder pelo dashboard.

## Criterios de aceite para considerar P2P pronto

- Usuario comprador logado consegue iniciar conversa apenas com empresa habilitada.
- Usuario deslogado e direcionado para login/cadastro antes de conversar.
- Empresa com plano bloqueado nao consegue receber conversa.
- Empresa com toggle desativado nao consegue receber conversa.
- Empresa visualiza conversas no dashboard.
- Empresa responde mensagens pelo dashboard.
- Cliente recebe resposta na tela `/chat`.
- Mensagens persistem ao recarregar.
- WebSocket funciona em producao atras do proxy.
- Mobile possui acesso ao Chat na bottom nav.
- Logs permitem diagnosticar bloqueios de plano, toggle e permissao.
