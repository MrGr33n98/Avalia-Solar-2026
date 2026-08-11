# frozen_string_literal: true

# Central administrativa SaaS. Não inclui catálogo físico.
ActiveAdmin.register_page 'Planos & Billing' do
  menu priority: 3

  content title: 'Planos & Billing' do
    overview = BillingAdminOverviewQuery.new.call
    tabs = [
      ['Visão Geral', admin_planos_billing_path], ['Planos', admin_plans_path],
      ['Assinaturas', admin_billing_company_subscriptions_path],
      ['Features', admin_feature_groups_path], ['Legado', admin_subscription_plans_path]
    ]

    div class: 'plans-billing-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
    end

    columns do
      metric = lambda do |title, value, detail|
        panel title do
          h2 number_with_delimiter(value, delimiter: '.')
          span detail
        end
      end

      column { metric.call('Planos públicos', overview[:public_plans], 'Planos SaaS visíveis') }
      column do
        metric.call('Assinaturas ativas', overview[:active_subscriptions], 'Active, trialing, past due e manual')
      end
      column { metric.call('Trials', overview[:trials], 'Assinaturas em período de trial') }
      column { metric.call('Past due', overview[:past_due], 'Assinaturas com cobrança pendente') }
    end

    columns do
      column do
        panel 'Operação' do
          para "Cancelamentos agendados: #{overview[:scheduled_cancellations]}"
          para "Empresas sem assinatura SaaS: #{overview[:companies_without_subscription]}"
          para "Features catalogadas: #{overview[:feature_count]}"
          para "Assinaturas legadas: #{overview[:legacy_subscriptions]}"
          mrr = number_to_currency(overview[:mrr_cents].to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
          para "MRR estimado: #{mrr}"
        end
      end
      column do
        panel 'Fontes canônicas' do
          para 'Plano atual: Plan'
          para 'Assinatura atual: Billing::CompanySubscription'
          para 'Features: PlanFeatureCatalog + CompanyFeatureAccessResolver'
          para 'Legado: SubscriptionPlan (não controla features atuais)'
        end
      end
    end

    panel 'Últimas assinaturas' do
      table_for overview[:latest_subscriptions] do
        column('Empresa') { |subscription| link_to subscription.company.name, admin_company_path(subscription.company) }
        column('Plano') { |subscription| subscription.plan.name }
        column('Status') { |subscription| status_tag subscription.status }
        column('Fim do período') { |subscription| subscription.current_period_end&.strftime('%d/%m/%Y') || '—' }
        column('Abrir') { |subscription| link_to 'Ver', admin_billing_company_subscription_path(subscription) }
      end
    end

    panel 'Catálogo físico fora desta central' do
      para 'Product, ProductOffer, ProductAccess e Pricing permanecem fora de Planos & Billing '
      para 'até classificação própria de Catálogo & Produtos.'
    end
  end
end
