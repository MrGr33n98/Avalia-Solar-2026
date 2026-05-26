# Spec de Design: Billing SaaS Avalia Solar

**Data:** 2026-05-26  
**Versão:** 1.0  
**Público-alvo:** Time de produto, designers, desenvolvedores frontend

---

## 1. Princípios de Design

- **Clareza antes de persuasão:** Instaladores solares são práticos — querem entender o valor rapidamente
- **Confiança visual:** Cores sólidas, preços claros, sem asteriscos escondidos
- **Mobile-first:** Donos de empresa acessam via celular
- **Redução de fricção:** O menor número de cliques possível do interesse ao pagamento
- **Feedback imediato:** Estados de loading, sucesso e erro são sempre explícitos

---

## 2. Página Pública `/pricing`

### 2.1 Headline

```
H1: "Escolha como a sua empresa aparece para quem quer comprar energia solar"

Subtítulo: "Do perfil gratuito ao destaque máximo. Sem contratos longos."
```

**Tom:** Direto, sem jargão técnico. O instalador quer saber o que ganha, não como funciona.

### 2.2 Cards de Planos

Layout: 3 cards lado a lado em desktop, empilhados em mobile.

#### Card Free

```
[ GRATUITO ]
────────────────────
R$ 0 / mês
Para sempre

✅ Perfil público básico
✅ Aparece nas categorias
✅ Receba avaliações de clientes
✅ Analytics básico de visitas
✅ 2 perguntas setoriais
❌ Destaque no ranking
❌ Botão de WhatsApp/Orçamento
❌ Galeria de fotos

[ Criar perfil grátis → ]
```

#### Card Pro (DESTACADO)

```
★ MAIS POPULAR
────────────────────
Pro
R$ 297* / mês
*Valor a confirmar

Tudo do Free, mais:
✅ Destaque na busca regional
✅ Botão de WhatsApp e Orçamento
✅ Galeria de fotos e vídeos
✅ Analytics avançado
✅ Intent score dos visitantes
✅ Até 10 perguntas setoriais
✅ Financiamento ativo
✅ Social proof em destaque

[ Começar 7 dias grátis → ]
```

*Design: Card Pro com borda colorida (verde/solar), badge "Mais Popular", box-shadow elevado*

#### Card Enterprise

```
Enterprise
Sob consulta

Tudo do Pro, mais:
✅ Acesso à API
✅ Webhooks personalizados
✅ Suporte prioritário com SLA
✅ Gerente de conta dedicado
✅ Analytics exportável
✅ Visibilidade máxima

[ Falar com nossa equipe → ]
```

### 2.3 Comparativo de Recursos (Tabela)

```
Expandido/colapsável abaixo dos cards.
Exibir seções colapsáveis por categoria:

▼ Perfil e Visibilidade
▼ Conversão de Leads
▼ Analytics e Inteligência
▼ Suporte e Integração
```

Cada linha: `Feature | Free | Pro | Enterprise`

### 2.4 CTAs por Plano

| Plano | CTA | Ação |
|---|---|---|
| Free | "Criar perfil grátis" | → /register (sem login) |
| Pro | "Começar 7 dias grátis" | → /login → checkout Stripe |
| Enterprise | "Falar com nossa equipe" | → Formulário ou WhatsApp |

**Se já autenticado e em Free:**
- Pro: "Fazer upgrade agora" → checkout direto

**Se já em Pro:**
- CTA desabilitado: "Seu plano atual ✓"

### 2.5 Perguntas Frequentes (FAQ)

Seção colapsável com 6-8 perguntas:

1. "Quando serei cobrado?"
2. "Posso cancelar quando quiser?"
3. "O que acontece com meu perfil se eu cancelar?"
4. "O plano Pro tem contrato de fidelidade?"
5. "Como funciona o teste grátis?"
6. "Quais formas de pagamento são aceitas?"
7. "Como funciona o Enterprise?"
8. "Posso usar o mesmo perfil para várias empresas?"

### 2.6 Linguagem para o Mercado Solar

| Genérico (evitar) | Solar (usar) |
|---|---|
| "Assinatura mensal" | "Plano mensal sem fidelidade" |
| "Dashboard analytics" | "Painel de visitas e leads" |
| "Upgrade de plano" | "Ter mais destaque" |
| "Enterprise plan" | "Solução para redes e grandes players" |
| "Feature flags" | "Recursos disponíveis" |

---

## 3. Dashboard "Plano e Cobrança" (Autenticado)

### 3.1 Localização

Aba "Plano e Cobrança" no Company Dashboard, acessível no menu lateral.  
URL: `/company-dashboard/billing`

### 3.2 Estados de Exibição

#### Estado 1: Free

```
┌─────────────────────────────────────────────┐
│ 📋 Seu Plano Atual                          │
│                                              │
│  ┌──────────┐                               │
│  │  FREE    │  Avalia Solar Gratuito        │
│  └──────────┘  Perfil básico ativo          │
│                                              │
│  [ Fazer upgrade para Pro → ]               │
│                                              │
│  💡 Com o Pro você recebe 3x mais          │
│     visualizações e botão de WhatsApp ativo │
└─────────────────────────────────────────────┘
```

#### Estado 2: Trialing (Trial Ativo)

```
┌─────────────────────────────────────────────┐
│ ⏰ Trial Pro — 5 dias restantes             │
│                                              │
│  ┌──────────┐                               │
│  │  PRO     │  Trial gratuito               │
│  └──────────┘                               │
│                                              │
│  Próxima cobrança: 02/06/2026               │
│  Valor: R$ 297,00/mês                       │
│                                              │
│  [ Gerenciar assinatura ]                   │
└─────────────────────────────────────────────┘
```

#### Estado 3: Ativo (Pro)

```
┌─────────────────────────────────────────────┐
│ ✅ Assinatura Ativa                         │
│                                              │
│  ┌──────────┐                               │
│  │  PRO ★   │  Avalia Solar Pro             │
│  └──────────┘  Todos os recursos ativos     │
│                                              │
│  Próxima cobrança: 26/06/2026               │
│  Valor: R$ 297,00/mês                       │
│                                              │
│  [ Gerenciar assinatura ]  [ Alterar plano ]│
└─────────────────────────────────────────────┘
```

#### Estado 4: Past Due (Pagamento Pendente)

```
┌─────────────────────────────────────────────┐
│ ⚠️ Pagamento pendente                        │
│ Atualize seu cartão para manter os recursos │
│                                              │
│  ┌──────────┐                               │
│  │  PRO ⚠️  │  Avalia Solar Pro             │
│  └──────────┘  Acesso pode ser suspenso     │
│                                              │
│  Tentativa de cobrança falhou em 20/06/2026 │
│                                              │
│  [ Atualizar cartão agora → ]               │
└─────────────────────────────────────────────┘
```

*Cor: banner vermelho/laranja, ícone de alerta, CTA urgente*

#### Estado 5: Cancelado (mas ainda no período)

```
┌─────────────────────────────────────────────┐
│ 📅 Assinatura cancelada                     │
│                                              │
│  ┌──────────┐                               │
│  │  PRO     │  Avalia Solar Pro             │
│  └──────────┘  Acesso até 26/06/2026        │
│                                              │
│  Após esta data seu perfil volta para Free  │
│                                              │
│  [ Reativar assinatura ]                    │
└─────────────────────────────────────────────┘
```

#### Estado 6: Enterprise/Manual

```
┌─────────────────────────────────────────────┐
│ 🏢 Plano Enterprise                         │
│                                              │
│  ┌────────────────┐                         │
│  │  ENTERPRISE 🌟 │  Gerenciado pela equipe │
│  └────────────────┘  Avalia Solar           │
│                                              │
│  Próxima renovação: a combinar              │
│                                              │
│  [ Falar com seu gerente de conta ]         │
└─────────────────────────────────────────────┘
```

### 3.3 Componentes Necessários

| Componente | Função |
|---|---|
| `CurrentPlanCard` | Card principal com plano e status |
| `BillingStatusBanner` | Banner de alerta para past_due/cancelado |
| `NextPaymentInfo` | Próxima cobrança e valor |
| `UpgradeButton` | CTA para iniciar checkout |
| `ManageSubscriptionButton` | Abre Customer Portal Stripe |
| `TrialCountdown` | Countdown de trial (se trialing) |
| `BillingLoadingSkeleton` | Estado de loading |
| `BillingErrorState` | Estado de erro de API |

---

## 4. Fluxo de Checkout

### 4.1 Antes de ir para o Stripe

```
┌─────────────────────────────────────────────┐
│ 💳 Assinar Avalia Solar Pro                 │
│                                              │
│ Você está assinando:                        │
│ ✦ Avalia Solar Pro                          │
│   R$ 297,00/mês                             │
│   Cancele quando quiser                     │
│                                              │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Carregando...    │
│                                              │
│ Você será redirecionado para o Stripe,      │
│ a plataforma de pagamento segura            │
└─────────────────────────────────────────────┘
```

Tempo de loading: criação do Stripe Checkout Session (~1-2s)  
**Não redirecionar antes de ter a URL.**

### 4.2 Retorno de Sucesso

URL: `/company-dashboard/billing?session_id=XXX&status=success`

```
┌─────────────────────────────────────────────┐
│ 🎉 Bem-vindo ao Pro!                        │
│                                              │
│ Sua assinatura foi ativada com sucesso.     │
│ Todos os recursos Pro estão disponíveis     │
│ agora.                                      │
│                                              │
│ [ Explorar recursos Pro → ]                 │
│ [ Voltar ao dashboard ]                     │
└─────────────────────────────────────────────┘
```

*Nota técnica: Mostrar estado de "ativação" otimista. O webhook pode demorar 5-30 segundos para confirmar. Fazer polling curto ou usar toast após retorno.*

### 4.3 Retorno de Cancelamento

URL: `/company-dashboard/billing?status=cancelled`

```
┌─────────────────────────────────────────────┐
│ Você voltou sem assinar                     │
│                                              │
│ Sem problema! Seu perfil Free continua      │
│ ativo normalmente.                          │
│                                              │
│ Se tiver dúvidas sobre o plano Pro,         │
│ estamos aqui:                               │
│ [ Falar com o suporte ]                     │
│ [ Voltar ao dashboard ]                     │
└─────────────────────────────────────────────┘
```

### 4.4 Falha de Pagamento (Past Due)

```
Banner persistente no dashboard (não modal):

⚠️ Sua cobrança de R$ 297,00 falhou em 20/06/2026.
   Atualize seus dados de pagamento para não perder o acesso.
   [ Atualizar cartão → ]
```

### 4.5 Mensagens em PT-BR

| Situação | Mensagem |
|---|---|
| Checkout criado | "Preparando checkout seguro..." |
| Erro ao criar checkout | "Não foi possível iniciar o checkout. Tente novamente ou fale com o suporte." |
| Sucesso pós-webhook | "Plano Pro ativo! Todos os recursos foram liberados." |
| Webhook pendente | "Confirmando ativação... (pode levar alguns segundos)" |
| Past due | "Pagamento pendente — atualize o cartão para manter o acesso" |
| Cancelado | "Assinatura cancelada. Acesso até [data]." |
| Trial expirando | "Seu trial termina em [N] dias. Assine para continuar." |

---

## 5. Design Responsivo

### Mobile (< 768px)
- Cards de plano empilhados, um por vez
- Swipe entre cards (carousel)
- Tabela de comparativo colapsada por padrão
- CTAs full-width
- Dashboard billing em scroll vertical único

### Tablet (768px - 1024px)
- Cards 2+1 (Free+Pro na primeira linha, Enterprise centralizado)
- Tabela de comparativo visível

### Desktop (> 1024px)
- 3 cards lado a lado
- Card Pro com elevação e destaque
- Tabela completa sem colapso

---

## 6. Tokens de Design

```css
/* Cores de plano */
--plan-free: #6B7280;       /* Cinza neutro */
--plan-pro: #F59E0B;        /* Âmbar/dourado — energia solar */
--plan-enterprise: #7C3AED; /* Roxo — premium */

/* Status de billing */
--status-active: #10B981;   /* Verde — tudo certo */
--status-trial: #3B82F6;    /* Azul — trial */
--status-past-due: #EF4444; /* Vermelho — ação necessária */
--status-canceled: #6B7280; /* Cinza — inativo */
--status-pending: #F59E0B;  /* Âmbar — aguardando */

/* Gradiente do card Pro */
background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
```
