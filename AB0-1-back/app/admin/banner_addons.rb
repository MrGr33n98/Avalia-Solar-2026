ActiveAdmin.register BannerAddon do
  menu parent: 'Avalia Solar Ads', priority: 3, label: 'Banner Add-ons'

  permit_params :name, :code, :category, :description, :price_cents, :promo_price_cents,
                :currency, :duration_days, :benefits, :rules, :priority_boost,
                :stackable, :auto_apply, :active

  index do
    selectable_column
    id_column
    column :name
    column :code
    column :category
    column 'Preço' do |addon|
      number_to_currency(addon.price_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
    end
    column 'Duração (dias)', :duration_days
    column :active
    column :priority_boost
    actions
  end

  filter :name
  filter :code
  filter :category
  filter :active

  form do |f|
    f.inputs 'Detalhes Básicos' do
      f.input :name
      f.input :code
      f.input :category
      f.input :description
      f.input :active
    end
    f.inputs 'Comercial' do
      f.input :price_cents, label: 'Preço (em centavos)'
      f.input :promo_price_cents, label: 'Preço Promocional (em centavos)'
      f.input :currency, input_html: { value: f.object.currency || 'BRL' }
      f.input :duration_days
    end
    f.inputs 'Regras e Benefícios (JSON)' do
      f.input :benefits, as: :text, input_html: { value: JSON.pretty_generate(f.object.benefits || {}) }
      f.input :rules, as: :text, input_html: { value: JSON.pretty_generate(f.object.rules || {}) }
    end
    f.inputs 'Configurações Técnicas' do
      f.input :priority_boost
      f.input :stackable
      f.input :auto_apply
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :code
      row :category
      row :description
      row :active
      row 'Preço' do |addon|
        number_to_currency(addon.price_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
      end
      row 'Preço Promocional' do |addon|
        if addon.promo_price_cents
          number_to_currency(addon.promo_price_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
        end
      end
      row :duration_days
      row :priority_boost
      row :stackable
      row :auto_apply
      row :benefits do |addon|
        pre JSON.pretty_generate(addon.benefits || {})
      end
      row :rules do |addon|
        pre JSON.pretty_generate(addon.rules || {})
      end
      row :created_at
      row :updated_at
    end

    panel 'Desempenho Comercial' do
      attributes_table_for resource do
        row 'Contratações Totais' do |addon|
          addon.banner_addon_subscriptions.count
        end
        row 'Contratações Ativas' do |addon|
          addon.banner_addon_subscriptions.where(status: 'active').count
        end
        row 'Receita Histórica' do |addon|
          total_cents = addon.banner_addon_subscriptions.where(status: ['active', 'expired']).sum(:price_paid_cents)
          number_to_currency(total_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
        end
        row 'Receita no Mês Atual' do |addon|
          total_cents = addon.banner_addon_subscriptions.where(status: ['active', 'expired'])
                                                      .where('created_at >= ?', Time.current.beginning_of_month)
                                                      .sum(:price_paid_cents)
          number_to_currency(total_cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.')
        end
      end
    end
  end
end
