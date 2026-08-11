# frozen_string_literal: true

ActiveAdmin.register Billing::CompanySubscription do
  menu false

  # Permite apenas atualização de notas via form clássico
  permit_params :admin_notes, :enterprise_notes, :is_enterprise_manual, :cancel_at_period_end

  # Scopes operacionais rápidos (abas)
  scope :all, default: true
  scope('Ativas', &:active_saas)
  scope('Trial') { |s| s.where(status: 'trialing') }
  scope('Past Due', &:past_due)
  scope('Canceladas', &:canceled)
  scope('Enterprise/Manual') { |s| s.where(status: 'manual') }
  scope('Cancelamento Agendado') { |s| s.where(cancel_at_period_end: true) }

  # Filtros na barra lateral
  filter :status, as: :select, collection: -> { Billing::CompanySubscription::STATUSES.map { |s| [s.humanize, s] } }
  filter :plan
  filter :is_enterprise_manual, as: :boolean, label: 'Enterprise Manual'
  filter :cancel_at_period_end, as: :boolean, label: 'Cancelamento Agendado'
  filter :company_name_cont, as: :string, label: 'Empresa (nome)'
  filter :created_at, label: 'Data de criação'
  filter :current_period_end, label: 'Fim do período atual'

  # Painel de Indicadores Rápidos no topo da página index
  sidebar 'Métricas de Faturamento', only: :index do
    div class: 'billing-metrics-panel' do
      div(class: 'billing-metric-card') do
        span(class: 'metric-title') { 'Assinaturas Ativas SaaS: ' } +
          strong(class: 'metric-value') { Billing::CompanySubscription.active_saas.count.to_s }
      end
      div(class: 'billing-metric-card', style: 'margin-top: 10px;') do
        span(class: 'metric-title') { 'Em período de Trial: ' } +
          strong(class: 'metric-value') { Billing::CompanySubscription.where(status: 'trialing').count.to_s }
      end
      div(class: 'billing-metric-card', style: 'margin-top: 10px;') do
        span(class: 'metric-title') { 'Past Due: ' } +
          strong(class: 'metric-value') { Billing::CompanySubscription.past_due.count.to_s }
      end
      div(class: 'billing-metric-card', style: 'margin-top: 10px;') do
        span(class: 'metric-title') { 'MRR Estimado: ' } +
          strong(class: 'metric-value') { "R$ #{format('%.2f', Billing::CompanySubscription.mrr_estimate / 100.0)}".gsub('.', ',') }
      end
    end
  end

  # Index (Listagem)
  index title: 'Assinaturas SaaS — Billing' do
    selectable_column
    id_column
    column('Empresa') do |sub|
      link_to sub.company.name, admin_company_path(sub.company)
    end
    column('Plano') do |sub|
      status_tag sub.plan.name, class: "aa-tier-#{sub.plan.plan_tier_template}"
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
        link_to "#{sub.stripe_customer_id.first(12)}...",
                "https://dashboard.stripe.com/customers/#{sub.stripe_customer_id}",
                target: '_blank', title: 'Abrir no Stripe'
      else
        span 'Manual/Enterprise', class: 'inline-hints'
      end
    end
    column('Fim do Período') { |sub| sub.current_period_end&.strftime('%d/%m/%Y') || '—' }
    column('Cancel Agendado') { |sub| sub.cancel_at_period_end? ? '✅' : '—' }
    column('Sincronizado') { |sub| sub.last_synced_at&.strftime('%d/%m/%Y %H:%M') || 'Nunca' }
    actions defaults: true do |sub|
      if current_admin_user.billing_support?
        item 'Sincronizar', sync_stripe_admin_billing_company_subscription_path(sub),
             method: :post, class: 'member_link', title: 'Sincronizar com Stripe'
      end
    end
  end

  # Show (Detalhes)
  show title: proc { |sub| "Assinatura: #{sub.company.name}" } do
    columns do
      column do
        attributes_table title: 'Informações Gerais da Assinatura' do
          row :id
          row('Empresa') { link_to resource.company.name, admin_company_path(resource.company) }
          row('Plano Atual') { status_tag resource.plan.name, class: "aa-tier-#{resource.plan.plan_tier_template}" }
          row('Status') do
            css = case resource.status
                  when 'active', 'trialing' then 'ok'
                  when 'past_due', 'unpaid' then 'error'
                  when 'canceled' then 'warning'
                  else 'yes'
                  end
            status_tag resource.status, class: css
          end
          row('Enterprise Manual?') { resource.is_enterprise_manual? ? 'Sim ✅' : 'Não' }
          row('Cancelamento Agendado?') { resource.cancel_at_period_end? ? 'Sim 📅' : 'Não' }
          row('Sincronizado em') { resource.last_synced_at&.strftime('%d/%m/%Y %H:%M:%S') || 'Nunca' }
          row('Data de Criação') { resource.created_at }
        end

        attributes_table title: 'Integração Stripe' do
          row('Stripe Customer ID') do
            if resource.stripe_customer_id.present?
              link_to resource.stripe_customer_id,
                      "https://dashboard.stripe.com/customers/#{resource.stripe_customer_id}", target: '_blank'
            else
              'Sem integração'
            end
          end
          row('Stripe Subscription ID') do
            if resource.stripe_subscription_id.present?
              link_to resource.stripe_subscription_id,
                      "https://dashboard.stripe.com/subscriptions/#{resource.stripe_subscription_id}", target: '_blank'
            else
              'Sem integração'
            end
          end
          row('Stripe Price ID') { resource.stripe_price_id || 'N/A' }
        end

        attributes_table title: 'Datas e Ciclo de Cobrança' do
          row('Início do Período Atual') { resource.current_period_start&.strftime('%d/%m/%Y %H:%M') || '—' }
          row('Fim do Período Atual') { resource.current_period_end&.strftime('%d/%m/%Y %H:%M') || '—' }
          row('Trial Start') { resource.trial_start&.strftime('%d/%m/%Y %H:%M') || '—' }
          row('Trial End') { resource.trial_end&.strftime('%d/%m/%Y %H:%M') || '—' }
          row('Cancelado em') { resource.canceled_at&.strftime('%d/%m/%Y %H:%M') || '—' }
          row('Último Erro de Cobrança') { resource.last_payment_error || 'Nenhum' }
          row('Data da Falha de Pagamento') { resource.last_payment_error_at&.strftime('%d/%m/%Y %H:%M') || '—' }
        end
      end

      column do
        panel '⚙️ Ações Administrativas de Billing' do
          div class: 'action-buttons-list' do
            # 1. Sincronizar com Stripe (Support+)
            if current_admin_user.billing_support?
              div style: 'margin-bottom: 15px;' do
                link_to '🔄 Sincronizar com Stripe', sync_stripe_admin_billing_company_subscription_path(resource),
                        method: :post, class: 'button', style: 'width: 100%; text-align: center; display: block;'
              end
            end

            # 2. Marcar como Enterprise (Finance+)
            if current_admin_user.billing_finance?
              div style: 'margin-bottom: 15px;' do
                link_to '🏢 Marcar como Enterprise / Manual', '#', class: 'button warning', style: 'width: 100%; text-align: center; display: block;',
                                                                  onclick: "var note = prompt('Justificativa obrigatória para ativar Enterprise:'); if(note) { var form = document.createElement('form'); form.method = 'POST'; form.action = '#{mark_enterprise_admin_billing_company_subscription_path(resource)}'; var input1 = document.createElement('input'); input1.type = 'hidden'; input1.name = 'justification'; input1.value = note; form.appendChild(input1); var notes = prompt('Notas adicionais do Enterprise (opcional):'); if(notes){ var input2 = document.createElement('input'); input2.type = 'hidden'; input2.name = 'enterprise_notes'; input2.value = notes; form.appendChild(input2); } var csrf = document.createElement('input'); csrf.type = 'hidden'; csrf.name = 'authenticity_token'; csrf.value = '#{form_authenticity_token}'; form.appendChild(csrf); document.body.appendChild(form); form.submit(); } return false;"
              end

              # 3. Forçar Downgrade para Free (Finance+)
              div style: 'margin-bottom: 15px;' do
                link_to '⬇️ Forçar Downgrade para Free', '#', class: 'button error', style: 'width: 100%; text-align: center; display: block;',
                                                              onclick: "var note = prompt('ATENÇÃO: Isso cancelará a assinatura no Stripe e rebaixará a empresa para Free. Justificativa obrigatória:'); if(note) { if(confirm('Tem certeza absoluta de que deseja rebaixar este cliente para o plano Free?')) { var form = document.createElement('form'); form.method = 'POST'; form.action = '#{force_downgrade_admin_billing_company_subscription_path(resource)}'; var input1 = document.createElement('input'); input1.type = 'hidden'; input1.name = 'justification'; input1.value = note; form.appendChild(input1); var input2 = document.createElement('input'); input2.type = 'hidden'; input2.name = 'confirmed'; input2.value = 'true'; form.appendChild(input2); var csrf = document.createElement('input'); csrf.type = 'hidden'; csrf.name = 'authenticity_token'; csrf.value = '#{form_authenticity_token}'; form.appendChild(csrf); document.body.appendChild(form); form.submit(); } } return false;"
              end

              # 4. Cancelar ao Fim do Período (Finance+)
              if resource.stripe_subscription_id.present? && !resource.cancel_at_period_end?
                div style: 'margin-bottom: 15px;' do
                  link_to '📅 Cancelar ao Fim do Período', '#', class: 'button error', style: 'width: 100%; text-align: center; display: block;',
                                                               onclick: "var note = prompt('Justificativa obrigatória para agendar cancelamento:'); if(note) { var form = document.createElement('form'); form.method = 'POST'; form.action = '#{cancel_at_period_end_admin_billing_company_subscription_path(resource)}'; var input1 = document.createElement('input'); input1.type = 'hidden'; input1.name = 'justification'; input1.value = note; form.appendChild(input1); var csrf = document.createElement('input'); csrf.type = 'hidden'; csrf.name = 'authenticity_token'; csrf.value = '#{form_authenticity_token}'; form.appendChild(csrf); document.body.appendChild(form); form.submit(); } return false;"
                end
              end
            end
          end
        end

        panel 'Notas Administrativas (Sem Justificativa de Auditoria)' do
          active_admin_form_for resource, url: admin_billing_company_subscription_path(resource), method: :patch do |f|
            f.inputs do
              f.input :admin_notes, label: 'Notas Admin Gerais', input_html: { rows: 4 }
              if current_admin_user.billing_finance? && resource.is_enterprise_manual?
                f.input :enterprise_notes, label: 'Notas Enterprise', input_html: { rows: 4 }
              end
            end
            f.actions do
              f.action :submit, label: 'Salvar Notas Administrativas'
            end
          end
        end
      end
    end

    panel '📋 Histórico de Auditoria de Faturamento (AdminActions)' do
      table_for resource.company.billing_admin_actions.order(performed_at: :desc) do
        column('Data') { |a| a.performed_at&.strftime('%d/%m/%Y %H:%M:%S') || '—' }
        column('Admin') { |a| a.admin_user&.email }
        column('Ação') { |a| status_tag a.action_type }
        column('Justificativa', &:justification)
        column('IP') { |a| a.ip_address || '—' }
      end
    end
  end

  # ============================================================
  # Member Actions (Controladores de Botões)
  # ============================================================

  # 1. Sincronizar com Stripe
  member_action :sync_stripe, method: :post do
    unless current_admin_user.billing_support?
      redirect_to resource_path, alert: 'Sem permissão para esta ação. Requer billing_support ou superior.'
      return
    end

    justification = params[:justification].presence || 'Sincronização manual solicitada via painel admin'

    Billing::AdminSubscriptionService.new(
      company: resource.company,
      admin_user: current_admin_user,
      justification: justification,
      ip_address: request.remote_ip
    ).sync_with_stripe!

    redirect_to resource_path, notice: 'Assinatura sincronizada com o Stripe com sucesso!'
  rescue StandardError => e
    redirect_to resource_path, alert: "Erro ao sincronizar: #{e.message}"
  end

  # 2. Marcar como Enterprise
  member_action :mark_enterprise, method: :post do
    unless current_admin_user.billing_finance?
      redirect_to resource_path, alert: 'Sem permissão para esta ação. Requer billing_finance ou superior.'
      return
    end

    if params[:justification].blank?
      redirect_to resource_path, alert: 'Justificativa obrigatória para marcar como Enterprise.'
      return
    end

    Billing::AdminSubscriptionService.new(
      company: resource.company,
      admin_user: current_admin_user,
      justification: params[:justification],
      ip_address: request.remote_ip
    ).mark_as_enterprise!(notes: params[:enterprise_notes])

    redirect_to resource_path, notice: 'A assinatura foi marcada como Enterprise e o plano foi alterado com sucesso!'
  rescue StandardError => e
    redirect_to resource_path, alert: "Erro ao marcar como Enterprise: #{e.message}"
  end

  # 3. Forçar Downgrade
  member_action :force_downgrade, method: :post do
    unless current_admin_user.billing_finance?
      redirect_to resource_path, alert: 'Sem permissão para esta ação. Requer billing_finance ou superior.'
      return
    end

    if params[:justification].blank? || params[:confirmed] != 'true'
      redirect_to resource_path, alert: 'Justificativa e confirmação são obrigatórias para rebaixar para Free.'
      return
    end

    Billing::AdminSubscriptionService.new(
      company: resource.company,
      admin_user: current_admin_user,
      justification: params[:justification],
      ip_address: request.remote_ip
    ).force_downgrade_to_free!(reason: params[:justification])

    redirect_to resource_path, notice: 'A assinatura foi rebaixada para o plano Free com cancelamento no Stripe.'
  rescue StandardError => e
    redirect_to resource_path, alert: "Erro ao realizar downgrade: #{e.message}"
  end

  # 4. Cancelar ao fim do período
  member_action :cancel_at_period_end, method: :post do
    unless current_admin_user.billing_finance?
      redirect_to resource_path, alert: 'Sem permissão para esta ação. Requer billing_finance ou superior.'
      return
    end

    if params[:justification].blank?
      redirect_to resource_path, alert: 'Justificativa obrigatória para agendar cancelamento.'
      return
    end

    Billing::AdminSubscriptionService.new(
      company: resource.company,
      admin_user: current_admin_user,
      justification: params[:justification],
      ip_address: request.remote_ip
    ).cancel_at_period_end!

    redirect_to resource_path, notice: 'Cancelamento da assinatura agendado para o fim do período com sucesso!'
  rescue StandardError => e
    redirect_to resource_path, alert: "Erro ao agendar cancelamento: #{e.message}"
  end
end
