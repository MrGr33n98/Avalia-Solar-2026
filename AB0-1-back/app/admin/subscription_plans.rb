ActiveAdmin.register SubscriptionPlan do
  menu label: 'Assinatura Legada (não controla features)', priority: 19

  permit_params :member_id, :product_id, :category_id, :plan_id, :value, :status, :purchased_at, :start_at, :end_at

  includes :member, :product, :category, :plan
  config.sort_order = 'start_at_desc'

  scope :all, default: true
  scope('Ativos', &:currently_active)
  scope('Trial', &:trial_status)
  scope('Expirados', &:expired_records)
  scope('Encerrando em 30 dias') { |scope| scope.ending_within(30) }

  filter :id
  filter :member_id, label: 'Cliente (ID)'
  filter :product_company_name_cont, as: :string, label: 'Empresa (nome)'
  filter :product
  filter :category
  filter :plan
  filter :status, as: :select, collection: proc { SubscriptionPlan.status_collection }
  filter :purchased_at
  filter :start_at
  filter :end_at
  filter :created_at
  filter :updated_at

  index title: 'Gestao de planos dos produtos' do
    selectable_column
    id_column
    column('Membro adquirinte') do |subscription|
      member_label =
        if subscription.member.present?
          link_to(subscription.member_display_name, admin_user_path(subscription.member), class: 'aa-link-strong')
        else
          subscription.member_display_name
        end

      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title') { member_label } +
          div(class: 'aa-entity-subtitle') { "ID ##{subscription.member_id || 'N/A'}" }
      end
    end
    column('Empresa') do |subscription|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title aa-entity-title--sm') { subscription.company&.name || '-' } +
          div(class: 'aa-entity-subtitle') { subscription.category&.name || 'Sem categoria' }
      end
    end
    column('Produto') do |subscription|
      div class: 'aa-entity-stack' do
        div(class: 'aa-entity-title aa-entity-title--sm') do
          link_to(subscription.product.name, admin_product_path(subscription.product), class: 'aa-link-strong')
        end +
          div(class: 'aa-entity-subtitle') { subscription.product.sku.presence || 'SKU não informado' }
      end
    end
    column('Categoria') do |subscription|
      link_to(subscription.category.name, admin_category_path(subscription.category), class: 'aa-link-strong')
    end
    column('Plano') do |subscription|
      link_to(subscription.plan.name, admin_plan_path(subscription.plan), class: 'aa-link-strong')
    end
    column('Valor do plano') do |subscription|
      div class: 'aa-metric-stack' do
        div(class: 'aa-metric-value') do
          number_to_currency(subscription.effective_value || 0, unit: 'R$ ', separator: ',', delimiter: '.')
        end +
          div(class: 'aa-metric-caption') { subscription.status_label }
      end
    end
    column('Situacao') do |subscription|
      css_class = if subscription.active_on?
                    'ok'
                  elsif subscription.expired?
                    'error'
                  else
                    'warning'
                  end
      status_tag(subscription.status_label, class: "aa-status-pill #{css_class}")
    end
    column('Adquirido em') { |subscription| subscription.purchased_at&.strftime('%d/%m/%Y') }
    column('Inicia em') { |subscription| subscription.start_at&.strftime('%d/%m/%Y') }
    column('Encerra em') { |subscription| subscription.end_at&.strftime('%d/%m/%Y') }
    column :created_at
    actions
  end

  show title: proc { |subscription| "Assinatura ##{subscription.id}" } do
    attributes_table do
      row :id
      row('Cliente', &:member_display_name)
      row('Produto') { |subscription| link_to(subscription.product.name, admin_product_path(subscription.product)) }
      row('Empresa do produto') { |subscription| subscription.company&.name || '-' }
      row('Categoria') do |subscription|
        link_to(subscription.category.name, admin_category_path(subscription.category))
      end
      row('Plano') { |subscription| link_to(subscription.plan.name, admin_plan_path(subscription.plan)) }
      row('Status') { |subscription| status_tag(subscription.status_label) }
      row('Valor contratado') do |subscription|
        number_to_currency(subscription.value || 0, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row('Valor efetivo') do |subscription|
        number_to_currency(subscription.effective_value || 0, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row :purchased_at
      row :start_at
      row :end_at
      row :created_at
      row :updated_at
    end
  end

  form do |f|
    f.inputs 'Assinatura SaaS' do
      f.input :member_id, label: 'Cliente (ID do User)', hint: 'Use o ID do usuario comprador.'
      f.input :category
      f.input :plan
      f.input :product
      f.input :status, as: :select, include_blank: 'Nao definido', collection: SubscriptionPlan.status_collection
      f.input :value, label: 'Valor contratado (opcional)'
      f.input :purchased_at, label: 'Adquirido em', as: :datepicker
      f.input :start_at, label: 'Inicio do ciclo', as: :datepicker
      f.input :end_at, label: 'Fim do ciclo', as: :datepicker
    end
    f.actions
  end

  batch_action :ativar do |ids|
    updated = 0
    batch_action_collection.where(id: ids).find_each do |subscription|
      next unless subscription.update(status: 'active', start_at: subscription.start_at || Time.current)

      updated += 1
    end
    redirect_to collection_path, notice: "#{updated} assinatura(s) ativada(s)."
  end

  batch_action :expirar do |ids|
    updated = 0
    batch_action_collection.where(id: ids).find_each do |subscription|
      next unless subscription.update(status: 'expired', end_at: subscription.end_at || Time.current)

      updated += 1
    end
    redirect_to collection_path, notice: "#{updated} assinatura(s) marcada(s) como expirada(s)."
  end

  controller do
    def scoped_collection
      super.includes(:member, :product, :category, :plan)
    end
  end
end
