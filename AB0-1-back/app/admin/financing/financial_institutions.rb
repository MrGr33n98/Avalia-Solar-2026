ActiveAdmin.register FinancialInstitution, namespace: :financiamentos do
  menu parent: 'Gestão de Ofertas', label: 'Instituições Financeiras', priority: 1

  permit_params :name, :slug, :short_name, :official_url, :active, :display_order, :featured, :logo,
                financing_options_attributes: [
                  :id, :credit_line, :target_audience, :amortization_system,
                  :max_term_months, :grace_period_months, :interest_rate_percent,
                  :minimum_project_value, :maximum_project_value,
                  :minimum_down_payment_percentage, :maximum_down_payment_percentage,
                  :valid_from, :valid_until, :terms_url, :active, :display_order, :_destroy
                ]

  index do
    selectable_column
    id_column
    column 'Logo' do |inst|
      if inst.logo.attached?
        image_tag url_for(inst.logo), height: '32px', style: 'object-fit: contain;'
      end
    end
    column :name
    column :short_name
    column :active
    column :featured
    column :display_order
    actions
  end

  filter :name
  filter :active
  filter :featured

  form do |f|
    f.semantic_errors

    f.inputs 'Identificação' do
      f.input :name
      f.input :slug
      f.input :short_name
      f.input :official_url
    end

    f.inputs 'Identidade Visual' do
      f.input :logo, as: :file, hint: f.object.logo.attached? ? image_tag(url_for(f.object.logo), height: '48px', style: 'object-fit: contain; background: #eee; padding: 4px;') : 'PNG, WebP ou SVG (min 128x128px)'
    end

    f.inputs 'Publicação e Ordenação' do
      f.input :active
      f.input :featured
      f.input :display_order
    end

    f.inputs 'Opções de Financiamento' do
      f.has_many :financing_options, heading: false, allow_destroy: true, new_record: true do |a|
        a.input :credit_line
        a.input :target_audience, as: :select, collection: FinancingOption::TARGET_AUDIENCES
        a.input :amortization_system, as: :select, collection: FinancingOption::AMORTIZATION_SYSTEMS
        a.input :interest_rate_percent, label: 'Taxa de Juros (%)'
        a.input :max_term_months, label: 'Prazo Máximo (meses)'
        a.input :grace_period_months, label: 'Carência (meses)'
        
        a.input :minimum_project_value, label: 'Valor Mínimo Projeto'
        a.input :maximum_project_value, label: 'Valor Máximo Projeto'
        
        a.input :minimum_down_payment_percentage, label: 'Entrada Mínima (%)'
        a.input :maximum_down_payment_percentage, label: 'Entrada Máxima (%)'
        
        a.input :valid_from, as: :datepicker, label: 'Válido a partir de'
        a.input :valid_until, as: :datepicker, label: 'Válido até'
        
        a.input :terms_url, label: 'URL dos Termos'
        a.input :display_order
        a.input :active
      end
    end

    f.actions
  end
  
  show do
    attributes_table do
      row :name
      row :slug
      row :short_name
      row :official_url
      row :active
      row :featured
      row :display_order
      row 'Logo' do |inst|
        if inst.logo.attached?
          image_tag url_for(inst.logo), height: '64px', style: 'object-fit: contain; background: #eee; padding: 8px;'
        end
      end
    end
    
    panel 'Opções de Financiamento' do
      table_for financial_institution.financing_options.ordered do
        column :credit_line
        column :target_audience
        column :amortization_system
        column :interest_rate_percent
        column :max_term_months
        column :active
      end
    end
  end
end
