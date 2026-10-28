# PRD — Person 360 | Múltiplos canais de contato

**Produto:** Avalia Solar — CRM interno  
**Versão:** 1.0 — proposta para implementação  
**Data:** 28/10/2026  
**Prioridade:** P0 (correção de botão inoperante e persistência) / P1 (integrações)  
**Rota de referência:** `/dashboard/sales/people/:id`  
**Destino no repositório:** `docs/crm/PRD_PERSON360_MULTI_CONTACT_METHODS.md`  

---

## 1. Contexto, diagnóstico e objetivo

Na página Person 360, o controle `+ Add info` da seção Contact Info é um elemento `<span>` sem `onClick`, formulário ou API associada. O componente pai também não transmite callback para cadastrar dados. O banco `sales_contacts` contém apenas um valor principal por tipo (`email`, `phone`, `whatsapp`, `linkedin_url`). O backend já possui `PATCH /api/v1/sales/contacts/:id` para atualizar esses campos, mas não permite modelar vários valores por tipo com preferência e rótulos. Esses fatos foram conferidos por leitura no repositório `MrGr33n98/Avalia-Solar-2026`.

**Objetivo:** transformar a seção Contact Info em um cadastro multicanal real: vários e-mails, números de telefone, WhatsApps e perfis sociais por pessoa, com criação, edição, definição do principal, arquivamento, ações rápidas e integração consistente com o restante do CRM — sem perda de dados legados.

**Público:** operador do CRM interno Avalia Solar. Não é uma funcionalidade de venda ou distribuição de leads.

**Indicadores de sucesso:**
- (a) 100% das ações visíveis do card com comportamento funcional;
- (b) adição e edição persistidas após recarregar;
- (c) nenhuma perda no backfill;
- (d) um e apenas um principal ativo para cada tipo quando há registros desse tipo;
- (e) nenhuma alteração não autorizada entre empresas/tenants;
- (f) ações de envio usam o destinatário explicitamente escolhido.

---

## 2. Escopo

### MVP — obrigatório
- Vários registros dos tipos `email`, `phone`, `whatsapp`, `linkedin`, `instagram` e `website` por pessoa.
- Rótulos (Trabalho, Pessoal, Comercial, Outro; texto customizado com limite), valor, tipo, ordem, canal principal e origem do registro.
- Modal acessível por `+ Add info`; adição, edição, definição de principal e arquivamento; estados de vazio, carregamento, sucesso e erro.
- Ações por item: copiar; enviar e-mail para endereço selecionado; ligar para número selecionado; abrir WhatsApp para número selecionado; abrir perfil social em endereço seguro.
- API REST tenant-scoped, validações, histórico mínimo de alteração, compatibilidade com campos legados e backfill idempotente.
- Refletir atualizações no Person 360, na seleção de destinatário de e-mail, na listagem/busca de contatos e no cadastro/importação pertinentes.
- Testes de autorização, concorrência, migração e regressão.

### Posterior / fora do MVP
- Envio de SMS/WhatsApp pela própria plataforma, verificação automática de posse de e-mail/número, discador, sincronização bidirecional com provedores, enriquecimento automático, novos canais (Telegram, TikTok, X), bulk edit, marketing automation multicanal avançado.

---

## 3. Regras de negócio (RB)

| ID | Regra |
|---|---|
| **RB-01** | Um contato pode ter N métodos de cada tipo; todos pertencem a um único contato e ao tenant proprietário. |
| **RB-02** | `kind` é enum controlado; `label` não determina canal. Valor original para apresentação e `normalized_value` para comparação. |
| **RB-03** | Por contato e tipo pode existir no máximo um registro ativo `is_primary=true` (índice parcial no PostgreSQL). O serviço garante exatamente um quando existir ao menos um ativo. |
| **RB-04** | Primeiro item ativo de um tipo vira principal automaticamente. Trocar principal acontece em transação com bloqueio da linha do contato. |
| **RB-05** | Ao arquivar o principal, promover explicitamente outro selecionado; se não houver outro, a projeção legada fica vazia. Não apagar fisicamente dados no fluxo comum. |
| **RB-06** | Não permitir duplicata ativa do mesmo `kind` + `normalized_value` dentro da mesma pessoa; permitir que pessoas diferentes compartilhem números/e-mails, sem mescla automática. |
| **RB-07** | E-mails são normalizados para comparação; telefones/WhatsApp usam E.164 quando houver país e número válidos (Brasil +55 como sugestão de interface, não presumir para registros internacionais). URLs exigem HTTPS e validação segura do host conforme o tipo. |
| **RB-08** | Verificação técnica de formato não significa consentimento nem comprova propriedade do canal. Consentimento/supressão permanece governado pelas políticas de e-mail existentes. |
| **RB-09** | Permissões e escopo passam pelo `scoped_contacts`/`TenantScope` e política de atualização, inclusive em métodos filhos. IDs de outros tenants retornam 404/403 consistente. |
| **RB-10** | As colunas `sales_contacts.email`/`phone`/`whatsapp`/`linkedin_url` continuam como espelho do método principal durante migração; o serviço centraliza toda escrita e impede divergência. |
| **RB-11** | Trocar o principal não altera destinatários ou conteúdo histórico de `sales_email_messages`. O envio novo deve usar o endereço escolhido, sem mudar automaticamente o principal. |
| **RB-12** | Toda mutação guarda ator e timestamps; auditoria e logs não exibem valores completos nem tokens. |
| **RB-13** | A interface não confirma sucesso antes da resposta da API. Falha de rede não cria contato fictício nem substitui registros locais silenciosamente. |
| **RB-14** | APIs e importadores legados que escrevem `email`/`phone`/`whatsapp`/`linkedin_url` devem passar pelo mesmo serviço de sincronização antes do corte final. |

---

## 4. Modelo relacional proposto

### 4.1 Tabela nova: `sales_contact_methods`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | bigint PK | Identificador do método |
| `company_id` | bigint FK | Tenant; coerência validada com `contact.account.company_id` |
| `sales_contact_id` | bigint FK | Pessoa proprietária, NOT NULL |
| `kind` | string NOT NULL | `email`, `phone`, `whatsapp`, `linkedin`, `instagram`, `website` |
| `value` | text NOT NULL | Valor fornecido/exibido; validado e limitado |
| `normalized_value` | text NOT NULL | Chave normalizada, computada no servidor |
| `label` | string | Trabalho, Pessoal, Comercial ou customizado |
| `is_primary` | boolean DEFAULT false | Principal por tipo |
| `position` | integer DEFAULT 0 | Ordenação estável no card |
| `source` | string DEFAULT 'manual' | `manual`, `migration`, `import`, `integration` |
| `created_by_id`, `updated_by_id` | bigint FK usuários, nullable | Auditoria |
| `archived_at` | timestamp nullable | Exclusão lógica |
| `created_at`, `updated_at` | timestamp | Rails |

**Índices e constraints:**
- `(company_id, sales_contact_id, kind)` para leitura rápida e isolamento;
- Índice único parcial: `(sales_contact_id, kind, normalized_value) WHERE archived_at IS NULL`;
- Índice único parcial: `(sales_contact_id, kind) WHERE is_primary=true AND archived_at IS NULL`;
- Foreign keys e checks para `kind`, formato básico, e regra de que `archived_at` é incompatível com `is_primary=true`.
- Validação tenant: considerar que `sales_contacts` se relaciona com `company` via `account` ou direto quando aplicável; nunca confiar só no ID do método vindo do cliente.

**Decisão arquitetural:**
Os registros da tabela nova serão a fonte da verdade; colunas antigas serão projeções de compatibilidade. Não usar JSON `metadata.contact_info[]` como tabela principal, pois dificultaria unicidade, índices relacionais, concorrência atômica e histórico.

### 4.2 Serviços backend
- `Sales::ContactMethods::Normalize` — parse seguro de e-mail, telefone e URL, sem mutações externas.
- `Sales::ContactMethods::Upsert` — criar/editar, checar escopo e unicidade, atribuir principal quando aplicável.
- `Sales::ContactMethods::SetPrimary` — troca atômica sob lock de contato e sincronização da projeção legada.
- `Sales::ContactMethods::Archive` — arquivar, promover substituto quando necessário, manter histórico.
- `Sales::ContactMethods::LegacySync` — traduzir atualizações antigas e importar dados existentes sem conflito.
- `Sales::ContactMethods::Audit` — atribuir ator e registrar evento sem PII bruta.

---

## 5. Contratos REST propostos

Recursos aninhados e tenant-scoped:

| Método | Rota | Semântica |
|---|---|---|
| `GET` | `/api/v1/sales/contacts/:id/contact_methods` | Lista os métodos ativos do contato |
| `POST` | `/api/v1/sales/contacts/:id/contact_methods` | Cria um método, opcionalmente primário |
| `PATCH` | `/api/v1/sales/contacts/:id/contact_methods/:method_id` | Atualiza valor, rótulo ou posição |
| `PATCH` | `/api/v1/sales/contacts/:id/contact_methods/:method_id/primary` | Define como principal de seu tipo |
| `DELETE` | `/api/v1/sales/contacts/:id/contact_methods/:method_id` | Arquiva; permite `replacement_id` do mesmo contato/tipo |

**Payload POST:**
```json
{
  "contact_method": {
    "kind": "email",
    "value": "comercial@exemplo.com.br",
    "label": "Trabalho",
    "is_primary": false
  }
}
```

**Response 201:**
```json
{
  "contact_method": {
    "id": 431,
    "kind": "email",
    "value": "comercial@exemplo.com.br",
    "label": "Trabalho",
    "is_primary": false,
    "position": 1,
    "created_at": "2026-10-28T12:00:00Z"
  }
}
```

**GET contato existente:**
Manter `email`, `phone`, `whatsapp`, `linkedin_url` e acrescentar `contact_methods: []` na resposta detalhada de `GET /contacts/:id`. Não remover atributos antigos nesta versão.

**Erros estáveis:**
- `400` Formato inválido (`INVALID_CONTACT_METHOD`);
- `401` Não autenticado;
- `403/404` Sem acesso ou fora de escopo (`CONTACT_METHOD_OUT_OF_SCOPE`);
- `409` Duplicidade ou conflito de concorrência (`CONTACT_METHOD_DUPLICATE`);
- `422` Regra de negócio (`PRIMARY_REPLACEMENT_REQUIRED`);
- `500` Erro inesperado.

**Concorrência:**
Serializar trocas de principal sob `contact.with_lock`, manter os dois índices únicos parciais, capturar `RecordNotUnique` como 409 e usar idempotência para criação em retries.

---

## 6. UX / Interface / Jornada

1. **Entrada:** Person 360 → card Contact Info → botão real `+ Add info` (`<button type="button">`) → abre o modal `Gerenciar informações de contato` (`ContactMethodsModal`).
2. **Modal:** Grupos por E-mails, Telefones, WhatsApp, LinkedIn, Instagram, Sites; cada linha com ícone, valor, rótulo, indicador Principal, ações Copiar/Usar/Editar/Tornar principal/Arquivar.
3. **Botão Adicionar Canal:** Permite selecionar tipo e preencher campo validado com máscara e sugestões de rótulos (Trabalho, Pessoal, Comercial, Outro).
4. **Ações Contextualizadas:**
   - Clicar em um e-mail abre o composer com esse endereço exato;
   - WhatsApp abre `wa.me/55...` somente com número normalizado;
   - Telefone abre `tel:...`;
   - URL externa validada e aberta com `target="_blank" rel="noopener noreferrer"`.
5. **Acessibilidade & Estados:**
   - Suporte a teclado (ESC, foco inicial, foco restaurado);
   - `aria-label` descritivos e semânticos;
   - Estados de loading (spinner/skeleton), erro claro e feedback de sucesso;
   - Sem confirmação visual falsa antes do retorno do backend.

---

## 7. User Stories e Critérios de Aceitação

| ID | User story | Aceite essencial | Prioridade |
|---|---|---|---|
| **US-01** | Como operador, quero clicar em `+ Add info` para cadastrar canais. | Abre modal funcional, fecha por ESC e restaura foco. | P0 |
| **US-02** | Como operador, quero ter vários e-mails por pessoa. | Dois e-mails distintos são salvos e aparecem após reload. | P0 |
| **US-03** | Como operador, quero vários telefones/WhatsApps. | Número internacional é validado e exibido com rótulo. | P0 |
| **US-04** | Como operador, quero adicionar múltiplos perfis sociais/sites. | LinkedIn, Instagram, website com URL segura e abertura correta. | P0 |
| **US-05** | Como operador, quero definir o principal por tipo. | Exatamente um principal ativo por tipo, mesmo com requisições concorrentes. | P0 |
| **US-06** | Como operador, quero editar, arquivar e substituir o principal. | Alterações persistem; exclusão não perde histórico. | P0 |
| **US-07** | Como operador, quero agir sobre um método específico. | Composer, ligação e WhatsApp usam o valor clicado. | P0 |
| **US-08** | Como operador, quero manter dados antigos. | Backfill 100%, páginas e contratos legados preservados. | P0 |
| **US-09** | Como administrador, quero proteger informações entre tenants. | Não é possível listar ou alterar métodos de outro tenant. | P0 |
| **US-10** | Como operador, quero feedback claro dos erros. | Sem falso sucesso, duplicata retorna 409 e formulário mantém conteúdo. | P0 |
| **US-11** | Como operador, quero pesquisar pessoas por canais secundários. | Pesquisa/indexação por método ativo, sem vazamento entre tenants. | P1 |
| **US-12** | Como operador, quero importar contatos com múltiplos canais. | Importação deduplica por pessoa/tipo/valor e segue lógica do serviço. | P1 |
| **US-13** | Como gestor, quero auditoria das alterações. | Ator, data e ação persistidos; logs mascaram PII. | P1 |
| **US-14** | Como usuário de teclado, quero navegar e editar sem mouse. | Controles acessíveis, foco, labels e erros associados. | P0 |

---

## 8. Requisitos Mínimos para Liberar o MVP

- **Funcionais:**
  - (RF-01) CRUD completo de métodos de contato;
  - (RF-02) Marcação de primário por tipo garantida;
  - (RF-03) Backfill dos valores legados existentes;
  - (RF-04) Compatibilidade retroativa da API legada;
  - (RF-05) Ações sobre o endereço ou número selecionado;
  - (RF-06) Modal com controles funcionais (sem botões decorativos);
  - (RF-07) Exclusão lógica (`archived_at`);
  - (RF-08) Validação de formato e duplicidade;
  - (RF-09) Identificação de tipo, rótulo e origem.
- **Não funcionais:**
  - (RNF-01) Isolamento multi-tenant estrito em leitura e escrita;
  - (RNF-02) Operação atômica e concorrente de principal;
  - (RNF-03) Logs sem valores completos de PII;
  - (RNF-04) UI acessível por teclado (WAI-ARIA);
  - (RNF-05) Backfill idempotente;
  - (RNF-06) Compatibilidade retroativa e rollback seguro;
  - (RNF-07) Testes unitários, request, integração e E2E;
  - (RNF-08) Tratamento de falha sem perda de dados.

---

## 9. Tasklist Priorizada

- [ ] **T-001 / P0** Inventariar leituras e escritas de `sales_contacts.email`, `phone`, `whatsapp`, `linkedin_url`.
- [ ] **T-002 / P0** Confirmar modelo de permissões e escopo por tenant.
- [ ] **T-003 / P0** Aprovar contrato OpenAPI / TypeScript.
- [ ] **T-004 / P0** Migration `sales_contact_methods` com FKs, constraints e índices parciais.
- [ ] **T-005 / P0** Modelo `Sales::ContactMethod`, validações e normalizador server-side.
- [ ] **T-006 / P0** Serviços transacionais (`Upsert`, `SetPrimary`, `Archive`, `LegacySync`).
- [ ] **T-007 / P0** Rake task de backfill idempotente sem perda de dados.
- [ ] **T-008 / P0** Sincronização legado -> novo no `Sales::Contact`.
- [ ] **T-009 / P0** Rotas e `Api::V1::Sales::ContactMethodsController`.
- [ ] **T-010 / P0** Serialização estendida em `contacts_controller#show`.
- [ ] **T-011 / P0** Códigos HTTP estáveis e proteção contra corrida.
- [ ] **T-012 / P0** Client TypeScript em `AB0-1-front/lib/api/sales/client.ts`.
- [ ] **T-013 / P0** Substituir `<span>` inerte em `PersonSummarySidebar.tsx` por botão acessível.
- [ ] **T-014 / P0** Criar `ContactMethodsModal.tsx` e `ContactMethodForm.tsx`.
- [ ] **T-015 / P0** Componente de linhas agrupadas com ações rápidas e indicador Principal.
- [ ] **T-016 / P0** Integrar estado reativo no `Person360FullView.tsx`.
- [ ] **T-017 / P0** Atualizar `SendEmailModal` e ações rápidas para selecionar destinatário.
- [ ] **T-018 / P0** Acessibilidade, estados de carregamento e textos PT-BR.
- [ ] **T-019 / P1** Busca e listagem para canais secundários.
- [ ] **T-020 / P1** Importação/exportação com múltiplos canais.
- [ ] **T-021 / P1** Auditoria e timeline.
- [ ] **T-022 / P0** Specs RSpec de modelo e serviços.
- [ ] **T-023 / P0** Request specs de autorização e endpoints.
- [ ] **T-024 / P0** Testes Jest/RTL no frontend.
- [ ] **T-025 / P0** Validação e backfill em staging.
- [ ] **T-026 / P0** Ativação e cutover em produção.

---

## 10. Arquivos Impactados

### Existentes:
- `AB0-1-front/components/sales/people/PersonSummarySidebar.tsx`
- `AB0-1-front/components/sales/people/Person360FullView.tsx`
- `AB0-1-front/components/sales/create/SendEmailModal.tsx`
- `AB0-1-front/lib/api/sales/client.ts`
- `AB0-1-back/app/models/sales/contact.rb`
- `AB0-1-back/app/controllers/api/v1/sales/contacts_controller.rb`
- `AB0-1-back/config/routes.rb`
- `AB0-1-back/db/schema.rb`

### Novos:
- `AB0-1-back/app/models/sales/contact_method.rb`
- `AB0-1-back/app/controllers/api/v1/sales/contact_methods_controller.rb`
- `AB0-1-back/app/services/sales/contact_methods/normalize.rb`
- `AB0-1-back/app/services/sales/contact_methods/upsert.rb`
- `AB0-1-back/app/services/sales/contact_methods/set_primary.rb`
- `AB0-1-back/app/services/sales/contact_methods/archive.rb`
- `AB0-1-back/app/services/sales/contact_methods/legacy_sync.rb`
- `AB0-1-back/db/migrate/*_create_sales_contact_methods.rb`
- `AB0-1-front/components/sales/people/ContactMethodsModal.tsx`
- `AB0-1-front/components/sales/people/ContactMethodForm.tsx`
- `AB0-1-front/components/sales/people/ContactMethodRow.tsx`
- `AB0-1-back/spec/requests/api/v1/sales/contact_methods_spec.rb`
- `AB0-1-back/spec/models/sales/contact_method_spec.rb`
- `AB0-1-front/__tests__/components/sales/ContactMethodsModal.spec.tsx`
