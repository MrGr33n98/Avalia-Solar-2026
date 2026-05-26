# PRD: Billing SaaS com Stripe — Avalia Solar

**Data:** 2026-05-26  
**Versão:** 1.0  
**Status:** Aguardando aprovação  
**Idioma:** PT-BR

---

## 1. Visão Geral

### Problema Que Estamos Resolvendo

O Avalia Solar possui um catálogo de planos (Free, Pro, Enterprise) e uma infraestrutura de feature gates sofisticada, mas **não possui cobrança recorrente real**. Atualmente:

- Empresas são associadas a planos manualmente no banco
- Não há cobrança automática mensal
- Não há fluxo de self-service para o cliente contratar ou cancelar
- O time admin precisa acessar o Stripe diretamente para qualquer informação de billing
- Eventos de billing não geram alertas operacionais

Isso **bloqueia a monetização escalável** da plataforma.

### O Que Estamos Construindo

Um módulo completo de **billing SaaS** que permite:

1. Empresas contratarem planos Free/Pro/Enterprise via Stripe Subscriptions
2. O time de produto acompanhar e operar billing pelo ActiveAdmin
3. Eventos críticos gerarem alertas automáticos no Slack
4. Toda ação manual ser auditada

---

## 2. Público-Alvo

### Usuário Final (B2B)
- **Instaladores solares** querendo mais destaque no marketplace
- **Fornecedores e distribuidores** querendo alcançar instaladores
- **Integradores** querendo qualificar seus projetos
- Perfil: empresário solar brasileiro, pequeno/médio porte, pouco familiarizado com SaaS

### Time Administrativo (Interno)
- **Suporte ao Cliente:** Responde tickets, precisa ver status de assinatura
- **Time Financeiro:** Acompanha receita, reconcilia pagamentos
- **Produto/Operações:** Gerencia casos edge, aplica Enterprise manual
- **Engenharia:** Reprocessa webhooks, diagnostica divergências

---

## 3. Objetivos de Negócio

| Objetivo | Métrica de Sucesso | Prazo |
|---|---|---|
| Ativar receita recorrente | Primeiras 10 assinaturas Pro pagas | M+1 |
| Eliminar operação manual de billing | 0 updates manuais de plan_id após launch | M+2 |
| Reduzir churn involuntário | < 5% cancelamentos por falha de pagamento | M+3 |
| Escalar sem aumentar equipe admin | Admin consegue operar 100+ assinaturas | M+3 |
| Visibilidade operacional total | 100% eventos de billing com alerta Slack | M+1 |

---

## 4. Objetivos do Usuário

| Usuário | Objetivo | Como Medimos |
|---|---|---|
| Instalador Free | Entender o que ganha ao virar Pro | Taxa de conversão Free→Pro |
| Instalador Pro | Pagar e ativar sem fricção | Checkout rate > 80% |
| Instalador Pro | Ver próxima cobrança e gerenciar cartão | Tickets de suporte sobre billing < 5/mês |
| Enterprise | Assinar sem passar por Stripe público | Satisfação do processo Enterprise |

---

## 5. Objetivos do Time Administrativo

- Ver todas as assinaturas ativas em um painel único
- Agir sobre casos de `past_due` sem acessar o Stripe diretamente
- Marcar empresas como Enterprise e registrar justificativa
- Auditar qualquer ação manual com rastreamento completo
- Receber alertas automáticos para eventos críticos

---

## 6. Planos

### 6.1 Plano Free

**Preço:** R$ 0/mês  
**Público:** Empresa nova na plataforma, quero testar antes de pagar  
**Proposta de valor:** "Apareça no marketplace e receba as primeiras avaliações"

Limites principais:
- Perfil público básico (nome, descrição, localização, categorias)
- Até 2 perguntas setoriais
- Analytics básico (visualizações do perfil)
- Sem destaque no ranking
- Sem CTA de WhatsApp/Orçamento ativo
- Sem galeria de mídia
- Sem analytics avançado

### 6.2 Plano Pro

**Preço:** ⚠️ *Decisão pendente — sugerido R$ 297/mês*  
**Público:** Empresa ativa querendo mais leads e conversão  
**Proposta de valor:** "Destaque-se da concorrência e converta mais visitantes"

Inclui tudo do Free, mais:
- Destaque no ranking por região/categoria
- CTA de WhatsApp e botão de orçamento
- Galeria de fotos e vídeos
- Analytics avançado (funil, top campanhas, reputação)
- Até 10 perguntas setoriais
- Social proof (depoimentos em destaque)
- Financiamento como feature ativa
- Intent score dos visitantes

### 6.3 Plano Enterprise

**Preço:** ⚠️ *Decisão pendente — sugerido R$ 997/mês ou negociação*  
**Processo:** ⚠️ *Decisão pendente — self-serve Stripe ou contato comercial?*  
**Público:** Redes de instaladores, fornecedores grandes, parceiros estratégicos  
**Proposta de valor:** "Tudo do Pro + integrações, suporte prioritário e visibilidade máxima"

Inclui tudo do Pro, mais:
- API de integração
- Webhooks personalizados
- White-label parcial
- Suporte prioritário com SLA
- Gerente de conta dedicado
- Analytics exportável
- Acesso antecipado a novas features

---

## 7. Funcionalidades de Billing

### 7.1 Trial

**Status:** ⚠️ *Decisão pendente*

Opções:
- A) 14 dias de trial Pro sem cartão → maior conversão, maior risco
- B) 7 dias de trial com cartão cadastrado → menor abandono pós-trial
- C) Sem trial — Free permanente como alternativa

**Recomendação:** Opção B (7 dias com cartão) ou Opção C (sem trial). Documentar como "decisão pendente" até validação comercial.

### 7.2 Upgrade (Free → Pro ou Pro → Enterprise)

**Fluxo:**
1. Usuário clica em "Fazer upgrade" no dashboard
2. API cria Stripe Checkout Session no modo `subscription`
3. Usuário é redirecionado para Stripe Hosted Checkout
4. Stripe processa e envia `customer.subscription.created`
5. Webhook atualiza `CompanySubscription` e `company.plan`
6. Alerta Slack `#billing-alerts`
7. Usuário retorna ao dashboard com plano ativo

**Proração:** Stripe aplica proração automática por padrão. ⚠️ *Decisão pendente: manter proração ou desabilitar?*

### 7.3 Downgrade (Pro → Free ou Enterprise → Pro)

**Fluxo:**
1. Usuário clica em "Rebaixar plano" no dashboard
2. Confirmação obrigatória com lista de features que serão perdidas
3. API chama Stripe para agendar mudança no fim do período atual
4. `CompanySubscription.cancel_at_period_end = true` + novo `plan_id` agendado
5. Dashboard mostra banner "Seu plano mudará para [X] em [data]"
6. Alerta Slack

**Importante:** Downgrade não é imediato — acontece no fim do período pago.

### 7.4 Cancelamento

**Fluxo:**
1. Usuário clica em "Cancelar assinatura" no Stripe Customer Portal
2. Stripe processa e envia `customer.subscription.deleted` ou `customer.subscription.updated` (com `cancel_at_period_end`)
3. Webhook registra intenção de cancelamento
4. Empresa mantém acesso Pro até fim do período
5. Após período: `company.plan` volta para Free, features bloqueadas
6. Alerta Slack `#billing-alerts`

**Alternativa via Admin:** Admin pode cancelar manualmente com justificativa registrada.

### 7.5 Reativação

**Fluxo:**
1. Empresa cancelada quer reativar
2. Usuário acessa portal Stripe ou inicia novo checkout
3. Novo `CompanySubscription` criado
4. Alerta Slack

### 7.6 Falha de Pagamento

**Fluxo:**
1. Stripe tenta cobrar e falha → `invoice.payment_failed`
2. Status muda para `past_due`
3. Email automático do Stripe para o cliente (Smart Retries)
4. Alerta Slack urgente `#billing-alerts`
5. Dashboard mostra banner de aviso + link para atualizar cartão
6. Após N dias sem pagamento: `canceled` automático pelo Stripe
7. Alerta Slack de cancelamento por inadimplência

**Smart Retry:** Stripe faz até 4 tentativas em ~21 dias por padrão.

### 7.7 Acesso a Recursos por Plano

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Perfil público básico | ✅ | ✅ | ✅ |
| Categorias de atuação | ✅ (básico) | ✅ | ✅ |
| Analytics básico | ✅ | ✅ | ✅ |
| Destaque no ranking | ❌ | ✅ | ✅ |
| CTA WhatsApp/Orçamento | ❌ | ✅ | ✅ |
| Galeria de mídia | ❌ | ✅ | ✅ |
| Analytics avançado | ❌ | ✅ | ✅ |
| Perguntas setoriais | 2 | 10 | Ilimitado |
| Social proof ativo | ❌ | ✅ | ✅ |
| Financiamento | ❌ | ✅ | ✅ |
| Intent score | ❌ | ✅ | ✅ |
| API/Webhooks | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| Suporte prioritário | ❌ | ❌ | ✅ |

---

## 8. Gestão Manual pelo Admin

O time de admin deve conseguir, via ActiveAdmin:

### Ações de Leitura (todos os admins)
- Ver lista de todas as assinaturas com filtros
- Ver detalhes completos de uma assinatura
- Ver histórico de eventos de billing de uma empresa
- Ver reason de falhas de pagamento
- Abrir links diretos para Stripe Dashboard (customer, subscription)

### Ações de Suporte (admins com role `support`)
- Sincronizar assinatura com Stripe
- Reprocessar último webhook
- Registrar observação administrativa
- Estender trial

### Ações Financeiras (admins com role `finance`)
- Todas as de suporte
- Marcar como Enterprise/manual
- Forçar downgrade para Free
- Cancelar no fim do período

### Ações Super Admin (role `super_admin`)
- Todas as anteriores
- Alterar Stripe IDs (com confirmação obrigatória)
- Bypass de qualquer gate de permissão

**Auditoria:** Toda ação manual deve ser logada com `admin_user_id`, timestamp, tipo de ação, justificativa.

---

## 9. Alertas Slack

### Canal `#billing-alerts` (novo)

Eventos que geram notificação:

| Evento | Urgência | Cor |
|---|---|---|
| Nova assinatura Pro | 🟢 Informativo | Verde |
| Enterprise marcado manualmente | 🟡 Atenção | Amarelo |
| Pagamento bem-sucedido | 🟢 Informativo | Verde |
| Pagamento falhou | 🔴 Urgente | Vermelho |
| Assinatura cancelada | 🟡 Atenção | Amarelo |
| Downgrade para Free | 🟡 Atenção | Amarelo |
| Assinatura `past_due` | 🔴 Urgente | Vermelho |
| Admin executou ação sensível | 🟡 Atenção | Amarelo |
| Divergência Stripe ↔ banco | 🔴 Crítico | Vermelho |

### Canal `#alertas` (existente — manter para técnico)

| Evento | Urgência |
|---|---|
| Webhook Stripe inválido | 🔴 Crítico |
| Webhook falhou no processamento | 🔴 Crítico |

---

## 10. Métricas de Sucesso

### Métricas de Produto

| Métrica | Definição | Meta M+3 |
|---|---|---|
| MRR (Monthly Recurring Revenue) | Soma das assinaturas ativas | R$ 5.000 |
| Conversão Free → Pro | % empresas Free que assinam Pro em 30 dias | > 5% |
| Churn Rate | % assinaturas canceladas no mês | < 5% |
| Churn Involuntário | % cancelamentos por falha de pagamento | < 2% |
| Trial Conversion | % trials que convertem em pagante | > 40% (se trial implementado) |

### Métricas Operacionais

| Métrica | Definição | Meta |
|---|---|---|
| Webhook Processing Time | Tempo médio de processamento | < 500ms |
| Webhook Success Rate | % webhooks processados com sucesso | > 99.9% |
| Admin Action Audit Rate | % ações manuais com justificativa | 100% |
| Stripe Sync Divergence | Assinaturas divergentes Stripe vs banco | 0 |

---

## 11. Fora de Escopo (v1.0)

- ❌ Billing por MercadoPago (apenas Stripe v1)
- ❌ Billing anual com desconto (apenas mensal v1)
- ❌ Módulo de faturas/notas fiscais
- ❌ Pagamento via boleto
- ❌ Affiliate/referral program
- ❌ Multimoeda (apenas BRL v1)
- ❌ Marketplace de add-ons avulsos
- ❌ Alteração de checkout de banner (mantido separado)
- ❌ App mobile de billing

---

## 12. Diferenças: Página Pública vs Autenticada

### `/pricing` (pública, sem login)

- Cards dos 3 planos com preços e features
- CTA "Começar grátis" → cadastro
- CTA "Assinar Pro" → login ou cadastro → checkout
- CTA "Falar com Vendas" → Enterprise → contato comercial
- Comparativo de features detalhado
- FAQ sobre billing
- **Dados da API:** `GET /api/v1/billing/plans` (público, sem auth)

### Dashboard "Plano e cobrança" (autenticada)

- Plano atual da empresa logada
- Status da assinatura (ativa, trial, past_due, cancelada)
- Próxima data de cobrança
- Botão "Gerenciar assinatura" → Stripe Customer Portal
- Botão "Fazer upgrade" → Stripe Checkout
- Banner de alerta se past_due
- Histórico básico de pagamentos (via Stripe Portal)
- **Dados da API:** `GET /api/v1/billing/current_subscription` (autenticado, por empresa)
