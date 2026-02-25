ActiveAdmin.register FinancingOption, namespace: :financiamentos do
  menu parent: 'Gestão de Ofertas', label: 'Opções de Financiamento'

  permit_params :company_id, :institution_name, :credit_line, :target_audience,
                :max_term_months, :grace_period_months, :interest_rate_percent,
                :interest_rate_details, :active,
                :service_filters, :project_filters, :category_filters

  index do
    selectable_column
    id_column
    column :company
    column :institution_name
    column :credit_line
    column :target_audience
    column :interest_rate_percent
    column :active
    actions
  end

  filter :company
  filter :institution_name
  filter :credit_line
  filter :target_audience, as: :select, collection: FinancingOption::TARGET_AUDIENCES
  filter :active

  form do |f|
    f.semantic_errors

    f.inputs 'Empresa e Instituição' do
      f.input :company
      f.input :institution_name
      f.input :credit_line
      f.input :target_audience, as: :select, collection: FinancingOption::TARGET_AUDIENCES
      f.input :active
    end

    f.inputs 'Condições Comerciais' do
      f.input :interest_rate_percent, label: 'Taxa de Juros (%)'
      f.input :interest_rate_details, label: 'Detalhes da Taxa'
      f.input :max_term_months, label: 'Prazo Máximo (meses)'
      f.input :grace_period_months, label: 'Carência (meses)'
    end

    f.inputs 'Filtros de Elegibilidade (Separar por vírgula)' do
      f.input :service_filters, label: 'Serviços'
      f.input :project_filters, label: 'Tipos de Projeto'
      f.input :category_filters, label: 'Categorias'
    end

    f.actions
  end

  show do
    attributes_table do
      row :company
      row :institution_name
      row :credit_line
      row :target_audience
      row :active

      row 'Taxas' do |o|
        "#{o.interest_rate_percent}% (#{o.interest_rate_details})"
      end

      row 'Prazos' do |o|
        "Até #{o.max_term_months} meses (Carência: #{o.grace_period_months} meses)"
      end

      row 'Filtros' do |o|
        div do
          strong 'Serviços: '
          span o.service_filters
        end
        div do
          strong 'Projetos: '
          span o.project_filters
        end
        div do
          strong 'Categorias: '
          span o.category_filters
        end
      end
    end
  end
end
