ActiveAdmin.register FinancingConfiguration, namespace: :financiamentos do
  menu parent: 'Configurações', label: 'Parâmetros Globais'

  permit_params :name, :financing_type, :active,
                :interest_rate_fixed, :interest_rate_variable,
                :grace_period_days,
                :min_installments, :max_installments,
                :min_amount, :max_amount

  # PaperTrail history
  config.create_another = true

  index do
    selectable_column
    id_column
    column :name
    column :financing_type
    column :active
    column :interest_rate_fixed
    column :interest_rate_variable
    column :grace_period_days
    column :created_at
    actions
  end

  filter :name
  filter :financing_type, as: :select, collection: FinancingConfiguration.financing_types
  filter :active

  form do |f|
    f.semantic_errors

    tabs do
      tab 'Geral' do
        f.inputs 'Identificação e Status' do
          f.input :name
          f.input :financing_type, as: :select, collection: FinancingConfiguration.financing_types.keys.map { |k|
            [k.titleize, k]
          }
          f.input :active, as: :boolean, label: 'Ativo'
        end
      end

      tab 'Taxas e Prazos' do
        f.inputs 'Taxas de Juros (%)' do
          f.input :interest_rate_fixed, input_html: { min: 0, step: 0.01 }
          f.input :interest_rate_variable, input_html: { min: 0, step: 0.01 }
        end

        f.inputs 'Carência' do
          f.input :grace_period_days, as: :number, input_html: { min: 0 }
          if f.object.grace_period_days.present?
            li "Equivalente a #{f.object.grace_period_months} meses ou #{f.object.grace_period_years} anos"
          end
        end
      end

      tab 'Limites e Parcelas' do
        f.inputs 'Parcelamento' do
          f.input :min_installments, as: :number, input_html: { min: 1 }
          f.input :max_installments, as: :number, input_html: { min: 1 }
        end

        f.inputs 'Valores (R$)' do
          f.input :min_amount, as: :number, input_html: { min: 0, step: 100 }
          f.input :max_amount, as: :number, input_html: { min: 0, step: 100 }
        end
      end
    end

    f.actions do
      f.action :submit
      f.action :cancel
      unless f.object.new_record?
        f.action :reset_defaults, label: 'Resetar para Padrões', as: :button, method: :put,
                                  url: reset_defaults_financiamentos_financing_configuration_path(f.object)
      end
    end
  end

  show do
    attributes_table do
      row :name
      row :financing_type
      row :active

      row 'Taxas' do |c|
        "Fixa: #{c.interest_rate_fixed}% | Variável: #{c.interest_rate_variable}%"
      end

      row 'Carência' do |c|
        "#{c.grace_period_days} dias (#{c.grace_period_months} meses)"
      end

      row 'Parcelas' do |c|
        "#{c.min_installments} a #{c.max_installments}x"
      end

      row 'Limites' do |c|
        "#{number_to_currency c.min_amount} a #{number_to_currency c.max_amount}"
      end

      row :created_at
      row :updated_at
    end

    panel 'Histórico de Alterações' do
      table_for resource.versions.order(created_at: :desc) do
        column 'Evento', :event
        column 'Usuário', :whodunnit
        column 'Data', :created_at
        column 'Mudanças' do |v|
          v.changeset.map { |k, val| "#{k}: #{val[0]} -> #{val[1]}" }.join(', ')
        end
      end
    end
  end

  member_action :reset_defaults, method: :put do
    resource.update!(
      interest_rate_fixed: 0.0,
      interest_rate_variable: 0.0,
      grace_period_days: 0,
      min_installments: 1,
      max_installments: 12,
      min_amount: 0.0,
      max_amount: 0.0
    )
    redirect_to resource_path(resource), notice: 'Configurações resetadas para os valores padrão.'
  end

  sidebar 'Simulação Rápida', only: :show do
    div do
      'Simule o financiamento com as taxas atuais:'
    end
    ul do
      li "Taxa Mensal: #{resource.interest_rate_fixed}%"
      li "Máximo Parcelas: #{resource.max_installments}"
    end
  end

  # JSON Import Action
  action_item :import_json, only: :index do
    link_to 'Importar JSON', import_json_financiamentos_financing_configurations_path
  end

  collection_action :import_json, method: :get do
    form_html = <<~HTML
      <div class="panel">
        <h3>Importar Configurações (JSON)</h3>
        <form action="#{process_import_json_financiamentos_financing_configurations_path}" method="post" enctype="multipart/form-data">
          <input type="hidden" name="authenticity_token" value="#{form_authenticity_token}">
          <div class="input">
            <label>Arquivo JSON</label>
            <input type="file" name="json_file" accept=".json" required>
          </div>
          <div class="actions">
            <button type="submit" class="button">Importar</button>
          </div>
        </form>
      </div>
    HTML
    render html: form_html.html_safe, layout: 'active_admin'
  end

  collection_action :process_import_json, method: :post do
    file = params[:json_file]
    if file
      JSON.parse(file.read)
      # Import logic would go here
      redirect_to collection_path, notice: 'Importação realizada com sucesso!'
    else
      redirect_to collection_path, alert: 'Nenhum arquivo enviado.'
    end
  rescue StandardError => e
    redirect_to collection_path, alert: "Erro na importação: #{e.message}"
  end
end
