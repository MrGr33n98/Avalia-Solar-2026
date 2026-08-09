ActiveAdmin.register BannerAddonSubscription do
  menu parent: 'Avalia Solar Ads', priority: 4, label: 'Contratações (Add-ons)'

  permit_params :company_id, :banner_id, :banner_addon_id, :status, :payment_gateway,
                :payment_reference, :starts_at, :ends_at, :price_paid_cents, :discount_cents

  index do
    selectable_column
    id_column
    column :company
    column :banner
    column :banner_addon
    column :status do |sub|
      status_tag sub.status, class: sub.status == 'active' ? 'ok' : (sub.status == 'expired' ? 'warning' : 'important')
    end
    column 'Valor Pago' do |sub|
      number_to_currency(sub.price_paid_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
    end
    column :starts_at
    column :ends_at
    actions
  end

  filter :company
  filter :banner
  filter :banner_addon
  filter :status
  filter :payment_gateway
  filter :starts_at
  filter :ends_at

  show do
    attributes_table do
      row :id
      row :company
      row :banner
      row :banner_addon
      row :status do |sub|
        status_tag sub.status, class: sub.status == 'active' ? 'ok' : (sub.status == 'expired' ? 'warning' : 'important')
      end
      row 'Preço Pago' do |sub|
        number_to_currency(sub.price_paid_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row 'Desconto' do |sub|
        number_to_currency(sub.discount_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row :starts_at
      row :ends_at
      row :payment_gateway
      row :payment_reference
      row :addon_snapshot do |sub|
        pre JSON.pretty_generate(sub.addon_snapshot || {})
      end
      row :created_at
      row :updated_at
    end
  end

  action_item :activate, only: :show do
    if resource.status == 'pending_payment'
      link_to 'Ativar Contratação', activate_admin_banner_addon_subscription_path(resource), method: :put, data: { confirm: 'Ativar esta assinatura manualmente?' }
    end
  end

  action_item :extend, only: :show do
    if resource.status == 'active'
      link_to 'Estender (+7 dias)', extend_admin_banner_addon_subscription_path(resource), method: :put, data: { confirm: 'Adicionar 7 dias à validade?' }
    end
  end

  action_item :cancel, only: :show do
    if resource.status == 'active' || resource.status == 'scheduled'
      link_to 'Cancelar', cancel_admin_banner_addon_subscription_path(resource), method: :put, data: { confirm: 'Cancelar contrato? (Não reverte pagamento automaticamente)' }
    end
  end

  action_item :refund, only: :show do
    if resource.status != 'refunded'
      link_to 'Marcar como Reembolsado', refund_admin_banner_addon_subscription_path(resource), method: :put, data: { confirm: 'Marcar como reembolsado e expirar benefícios?' }
    end
  end

  member_action :activate, method: :put do
    BannerAddons::LifecycleService.activate_subscription(resource)
    redirect_to resource_path(resource), notice: 'Contratação ativada com sucesso.'
  end

  member_action :extend, method: :put do
    BannerAddons::LifecycleService.extend_subscription(resource, 7)
    redirect_to resource_path(resource), notice: 'Contratação estendida por 7 dias.'
  end

  member_action :cancel, method: :put do
    BannerAddons::LifecycleService.cancel_subscription(resource)
    redirect_to resource_path(resource), notice: 'Contratação cancelada.'
  end

  member_action :refund, method: :put do
    BannerAddons::LifecycleService.refund_subscription(resource)
    redirect_to resource_path(resource), notice: 'Contratação reembolsada e cancelada.'
  end
end
