# Spec ActiveAdmin: Billing SaaS

**Data:** 2026-05-26  
**Versão:** 1.0

---

## 1. Princípios do Admin de Billing

- O ActiveAdmin é uma **ferramenta operacional**, não substituto do Stripe Dashboard
- Cada ação manual deve ter **justificativa obrigatória**
- Toda ação fica registrada em `billing_admin_actions` — auditoria imutável
- O admin **nunca cria estado financeiro impossível** sem confirmação e auditoria
- Links diretos para o Stripe Dashboard são preferíveis a replicar funcionalidades complexas

---

## 2. Menu e Navegação

```
Admin Menu
├── Billing (grupo colapsável)
│   ├── Assinaturas SaaS      → /admin/billing_company_subscriptions
│   ├── Planos (Catálogo)     → /admin/plans (já existe)
│   └── Ações Administrativas → /admin/billing_admin_actions
└── ... (outros recursos)
```

---

## 3. Resource: `Billing::CompanySubscription`

**Rota:** `/admin/billing_company_subscriptions`  
**Label do menu:** `"Billing — Assinaturas SaaS"`  
**Priority:** 20

### 3.1 Painel de Indicadores Rápidos (Dashboard Panel)

Painel no topo da listagem com cards de métricas:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Assinaturas  │ │   Em Trial   │ │  Past Due    │ │  Canceladas  │
│   Ativas     │ │              │ │              │ │  (30 dias)   │
│              │ │              │ │              │ │              │
│    42 🟢     │ │    7 🔵      │ │    3 🔴      │ │    5 ⚫      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│ MRR Estimado │
│ R$ 12.474/mês│
└──────────────┘
```

### 3.2 Scopes (Abas rápidas)

```ruby
scope :all, default: true
scope('🟢 Ativas')        { |s| s.active_saas }
scope('🔵 Trial')          { |s| s.where(status: 'trialing') }
scope('🔴 Past Due')       { |s| s.past_due }
scope('⚫ Canceladas')     { |s| s.canceled }
scope('🏢 Enterprise/Manual') { |s| s.manual_accounts }
scope('⚠️ Cancel at Period End') { |s| s.where(cancel_at_period_end: true) }
```

### 3.3 Filtros

```ruby
filter :status, as: :select,
       collection: Billing::CompanySubscription::STATUSES.map { |s| [s.humanize, s] }
filter :plan
filter :is_enterprise_manual, as: :boolean, label: 'Enterprise Manual'
filter :cancel_at_period_end, as: :boolean, label: 'Cancelamento Agendado'
filter :company_name_cont, as: :string, label: 'Empresa (nome)'
filter :created_at, label: 'Data de criação'
filter :current_period_end, label: 'Fim do período atual'
filter :last_payment_error_at, label: 'Última falha de pagamento'
```

### 3.4 Listagem (Index)

Colunas:

| Coluna | Conteúdo | Observação |
|---|---|---|
| ID | link para show | |
| Empresa | nome + link para admin company | |
| Plano | nome do plano + badge de tier | |
| Status | status_tag colorido | |
| Stripe Customer | primeiros 12 chars + link Stripe | Não exibir completo |
| Período Atual | start → end formatado | |
| Cancel at Period End | ✅/❌ | |
| Última Falha | data formatada ou "—" | |
| Sincronizado em | `last_synced_at` | |
| Ações | Ver / Sincronizar | |

```ruby
index title: 'Assinaturas SaaS — Billing' do
  selectable_column
  id_column

  column('Empresa') do |sub|
    link_to sub.company.name, admin_company_path(sub.company)
  end

  column('Plano') do |sub|
    status_tag sub.plan.name, class: "aa-tier-#{sub.plan.plan_tier}"
  end

  column('Status') do |sub|
    css = case sub.status
          when 'active', 'trialing' then 'ok'
          when 'past_due', 'unpaid' then 'error'
          when 'canceled' then 'warning'
          else 'yes'
          end
    status_tag sub.status, class: css
  end

  column('Stripe Customer') do |sub|
    if sub.stripe_customer_id.present?
      link_to sub.stripe_customer_id.first(18) + '...',
              "https://dashboard.stripe.com/customers/#{sub.stripe_customer_id}",
              target: '_blank', title: 'Abrir no Stripe'
    else
      span 'Manual', class: 'inline-hints'
    end
  end

  column('Fim do Período') { |sub| sub.current_period_end&.strftime('%d/%m/%Y') || '—' }
  column('Cancel Agendado') { |sub| sub.cancel_at_period_end? ? '✅' : '—' }
  column('Última Falha') { |sub| sub.last_payment_error_at&.strftime('%d/%m/%Y %H:%M') || '—' }
  column('Sincronizado') { |sub| sub.last_synced_at&.strftime('%d/%m/%Y %H:%M') || 'Nunca' }

  actions defaults: true do |sub|
    item 'Sincronizar', sync_stripe_admin_billing_company_subscription_path(sub),
         method: :post, title: 'Sincronizar com Stripe'
  end
end
```

### 3.5 Página de Detalhe (Show)

#### Seção: Informações Gerais

```
Empresa:              Energia Solar SP | link
Plano atual:          Pro [badge]
Status:               active [badge verde]
Enterprise Manual:    Não
Cancel at Period End: Não
Sincronizado em:      26/05/2026 14:30
```

#### Seção: IDs do Stripe

```
Stripe Customer ID:     cus_XXXX [link → Stripe Dashboard Customer]
Stripe Subscription ID: sub_XXXX [link → Stripe Dashboard Subscription]
Stripe Price ID:        price_XXXX
```

*Layout: texto truncado + link com ícone externo. Não editar inline.*

#### Seção: Período e Cobrança

```
Período Atual:  26/05/2026 → 26/06/2026
Trial Start:    —
Trial End:      —
Cancelado em:   —
Última falha:   —
Motivo falha:   —
```

#### Seção: Observações Administrativas

```
[textarea] Notas internas sobre esta empresa...
[ Salvar nota ]  (não requer justificativa, apenas auditoria)
```

#### Painel: Ações Administrativas

```
┌─────────────────────────────────────────────┐
│ ⚙️ Ações Administrativas                    │
│                                              │
│ [ 🔄 Sincronizar com Stripe ]               │
│   Atualiza status local com dados do Stripe │
│                                              │
│ [ 🔗 Abrir no Stripe (Customer) ]           │
│   Link externo para o Stripe Dashboard      │
│                                              │
│ [ 🔗 Abrir Subscription no Stripe ]         │
│   Link externo para subscription            │
│                                              │
│ [ 🏢 Marcar como Enterprise/Manual ]        │
│   Requires: billing_finance role            │
│   Requires: justificativa                   │
│                                              │
│ [ ⬇️ Forçar Downgrade para Free ]          │
│   Requires: billing_finance role            │
│   Requires: justificativa + confirmação     │
│                                              │
│ [ 📅 Cancelar ao Fim do Período ]           │
│   Requires: billing_finance role            │
│                                              │
│ [ 🔁 Reprocessar Último Webhook ]           │
│   Requires: billing_super_admin role        │
└─────────────────────────────────────────────┘
```

#### Painel: Histórico de Ações Administrativas

```
Data          | Admin              | Ação               | Justificativa
26/05/2026    | joao@avalia.com   | sync_stripe        | "Cliente reclamou de acesso"
25/05/2026    | maria@avalia.com  | mark_enterprise    | "Contrato assinado #1234"
```

### 3.6 Ações Member (Individuais)

Todas as ações below exigem `billing_support` ou superior:

```ruby
# Sincronizar com Stripe
member_action :sync_stripe, method: :post do
  unless current_admin_user.billing_support?
    redirect_to resource_path, alert: 'Sem permissão para esta ação'
    return
  end

  justification = params[:justification].presence || 'Sincronização manual solicitada'
  result = Billing::AdminSubscriptionService.new(
    company: resource.company,
    admin_user: current_admin_user,
    justification: justification
  ).sync_with_stripe!

  redirect_to resource_path, notice: 'Assinatura sincronizada com o Stripe.'
rescue => e
  redirect_to resource_path, alert: "Erro ao sincronizar: #{e.message}"
end

# Marcar como Enterprise
member_action :mark_enterprise, method: :post do
  unless current_admin_user.billing_finance?
    redirect_to resource_path, alert: 'Permissão de billing_finance necessária'
    return
  end

  if params[:justification].blank?
    redirect_to resource_path, alert: 'Justificativa obrigatória'
    return
  end

  Billing::AdminSubscriptionService.new(
    company: resource.company,
    admin_user: current_admin_user,
    justification: params[:justification]
  ).mark_as_enterprise!(notes: params[:enterprise_notes])

  redirect_to resource_path, notice: 'Empresa marcada como Enterprise.'
end

# Forçar downgrade
member_action :force_downgrade, method: :post do
  unless current_admin_user.billing_finance?
    redirect_to resource_path, alert: 'Permissão de billing_finance necessária'
    return
  end

  unless params[:justification].present? && params[:confirmed] == 'true'
    redirect_to resource_path,
                alert: 'Justificativa e confirmação obrigatórias para downgrade forçado'
    return
  end

  Billing::AdminSubscriptionService.new(
    company: resource.company,
    admin_user: current_admin_user,
    justification: params[:justification]
  ).force_downgrade_to_free!(reason: params[:justification])

  redirect_to resource_path, notice: 'Empresa rebaixada para Free. Stripe cancelado.'
end
```

### 3.7 Restrições de Edição de Formulário

O formulário de edição (form) deve:

**Permitir (todos os admins):**
- `admin_notes` — campo de observação livre

**Permitir (billing_finance+):**
- `is_enterprise_manual` — checkbox
- `enterprise_notes` — notas do Enterprise
- `cancel_at_period_end` — flag

**Bloquear (sem role billing_super_admin):**
- `stripe_customer_id` — só leitura
- `stripe_subscription_id` — só leitura
- `stripe_price_id` — só leitura
- `company_id` — não editável via form
- `status` — via ação específica, não form livre

---

## 4. Resource: `Plan` (Modificações)

Adicionar à view show e ao form de `admin/plans.rb`:

```ruby
# Na seção show:
row('Stripe Product ID') { resource.stripe_product_id || 'Não configurado' }
row('Stripe Price ID Mensal') { resource.stripe_price_id_monthly || 'Não configurado' }
row('Exibir no /pricing') { resource.is_public ? '✅ Público' : '❌ Interno' }
row('Ordem de exibição') { resource.display_order }

# Alerta de configuração incompleta:
if resource.stripe_price_id_monthly.blank?
  status_tag('Stripe não configurado — checkout impossível', class: 'error')
end
```

---

## 5. Resource: `Billing::AdminAction`

**Rota:** `/admin/billing_admin_actions`  
**Permissão:** Apenas leitura para todos os admins autenticados

```ruby
ActiveAdmin.register Billing::AdminAction do
  menu label: 'Billing — Auditoria', priority: 21, parent: 'Billing'
  actions :index, :show  # Sem create/edit/delete via UI

  filter :action_type, as: :select, collection: Billing::AdminAction::ACTION_TYPES
  filter :admin_user
  filter :company
  filter :performed_at

  index do
    id_column
    column('Data') { |a| a.performed_at.strftime('%d/%m/%Y %H:%M') }
    column('Admin') { |a| a.admin_user.email }
    column('Empresa') { |a| a.company.name }
    column('Ação') { |a| status_tag a.action_type }
    column('Justificativa') { |a| truncate(a.justification, length: 80) }
    actions defaults: false do |a|
      item 'Ver', admin_billing_admin_action_path(a)
    end
  end

  show do
    attributes_table do
      row :id
      row('Data') { resource.performed_at.strftime('%d/%m/%Y %H:%M:%S') }
      row('Admin') { resource.admin_user.email }
      row('Empresa') { link_to resource.company.name, admin_company_path(resource.company) }
      row('Ação') { status_tag resource.action_type }
      row('Justificativa') { resource.justification }
      row('Metadados') { pre JSON.pretty_generate(resource.metadata) }
      row('IP') { resource.ip_address }
    end
  end
end
```

---

## 6. Regras de Acesso por Role

| Feature | Sem Role | support | finance | super_admin |
|---|---|---|---|---|
| Ver lista assinaturas | ✅ | ✅ | ✅ | ✅ |
| Ver detalhes assinatura | ✅ | ✅ | ✅ | ✅ |
| Ver auditoria de ações | ✅ | ✅ | ✅ | ✅ |
| Adicionar nota admin | ✅ | ✅ | ✅ | ✅ |
| Sincronizar com Stripe | ❌ | ✅ | ✅ | ✅ |
| Reprocessar webhook | ❌ | ❌ | ❌ | ✅ |
| Marcar Enterprise | ❌ | ❌ | ✅ | ✅ |
| Forçar downgrade | ❌ | ❌ | ✅ | ✅ |
| Cancelar at period end | ❌ | ❌ | ✅ | ✅ |
| Editar Stripe IDs | ❌ | ❌ | ❌ | ✅ |
| Editar plan form (stripe) | ❌ | ❌ | ✅ | ✅ |

---

## 7. Alertas e Indicadores Visuais

```ruby
# Status tags com cores semânticas
case subscription.status
when 'active'    then status_tag 'Ativa', class: 'ok'
when 'trialing'  then status_tag 'Trial', class: 'yes'
when 'past_due'  then status_tag 'Past Due', class: 'error'
when 'canceled'  then status_tag 'Cancelada', class: 'warning'
when 'manual'    then status_tag 'Enterprise Manual', class: 'orange'
when 'unpaid'    then status_tag 'Inadimplente', class: 'error'
end

# Alerta de divergência
if subscription.last_synced_at < 24.hours.ago
  status_tag 'Sincronização desatualizada', class: 'warning'
end
```
