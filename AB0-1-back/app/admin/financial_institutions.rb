ActiveAdmin.register FinancialInstitution do
  menu priority: 5, label: 'Instituições Financeiras'

  permit_params :name, :slug, :description, :website, :active, :featured, :display_order, :logo,
                financing_options_attributes: %i[id credit_line target_audience max_term_months grace_period_months interest_rate_percent minimum_project_value maximum_project_value minimum_down_payment_percentage maximum_down_payment_percentage amortization_system display_order valid_from valid_until terms_url active _destroy]

  filter :name
  filter :active
  filter :featured

  index do
    selectable_column
    id_column
    column 'Logo' do |fi|
      if fi.logo.attached?
        image_tag(fi.logo_url, height: '40')
      else
        span '-'
      end
    end
    column :name
    column :active
    column :featured
    column :display_order
    actions
  end

  form html: { multipart: true } do |f|
    f.semantic_errors(*f.object.errors.keys)

    f.inputs 'Detalhes da Instituição' do
      f.input :name, label: 'Nome'
      f.input :slug, label: 'Slug (opcional)'
      f.input :description, label: 'Descrição'
      f.input :website, label: 'Website'
      f.input :logo, as: :file, label: 'Minilogo (PNG, WebP ou SVG)'
      if f.object.logo.attached?
        div do
          span 'Logo Atual: '
          image_tag(f.object.logo_url, height: '40')
        end
      end
      f.input :active, label: 'Ativo'
      f.input :featured, label: 'Destaque'
      f.input :display_order, label: 'Ordem de Exibição'
    end

    f.inputs 'Opções de Financiamento' do
      f.has_many :financing_options, allow_destroy: true, heading: false, new_record: 'Adicionar Opção' do |fo|
        fo.input :credit_line, label: 'Linha de Crédito'
        fo.input :target_audience, as: :select, collection: FinancingOption::TARGET_AUDIENCES, label: 'Público Alvo'
        fo.input :amortization_system, as: :select, collection: FinancingOption::AMORTIZATION_SYSTEMS, label: 'Sistema de Amortização'
        fo.input :interest_rate_percent, label: 'Taxa de Juros Mensal (%)', input_html: { step: 0.01 }
        fo.input :max_term_months, label: 'Prazo Máximo (meses)'
        fo.input :grace_period_months, label: 'Carência (meses)'
        fo.input :minimum_down_payment_percentage, label: 'Entrada Mínima (%)'
        fo.input :display_order, label: 'Ordem'
        fo.input :active, label: 'Ativa'
      end
    end

    f.actions
  end

  show do
    attributes_table do
      row :name
      row :slug
      row :description
      row :website
      row 'Logo' do |fi|
        if fi.logo.attached?
          image_tag(fi.logo_url, height: '60')
        else
          span '-'
        end
      end
      row :active
      row :featured
      row :display_order
      row :created_at
      row :updated_at
    end

    panel 'Opções de Financiamento' do
      table_for financial_institution.financing_options.ordered do
        column :credit_line
        column :target_audience
        column :amortization_system
        column :interest_rate_percent
        column :max_term_months
        column :grace_period_months
        column :active
      end
    end
  end
end
