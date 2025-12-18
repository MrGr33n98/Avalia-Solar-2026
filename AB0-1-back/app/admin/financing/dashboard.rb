ActiveAdmin.register_page "Dashboard", namespace: :financiamentos do
  menu priority: 1, label: proc { I18n.t("active_admin.dashboard") }

  content title: proc { I18n.t("active_admin.dashboard") } do
    columns do
      column do
        panel "Ofertas Recentes" do
          ul do
            FinancingOption.order(created_at: :desc).limit(5).map do |option|
              li link_to("#{option.institution_name} - #{option.credit_line} (#{option.company.name})", financiamentos_financing_option_path(option))
            end
          end
        end
      end

      column do
        panel "Estatísticas" do
          div do
            strong "Total de Opções Ativas: "
            span FinancingOption.active_only.count
          end
          div do
            strong "Taxa Média (PF): "
            span "#{FinancingOption.active_only.where(target_audience: 'PF').average(:interest_rate_percent)&.round(2)}%"
          end
          div do
            strong "Taxa Média (PJ): "
            span "#{FinancingOption.active_only.where(target_audience: 'PJ').average(:interest_rate_percent)&.round(2)}%"
          end
        end
      end
    end
    
    columns do
      column do
        panel "Ações Rápidas" do
          div do
            link_to "Nova Configuração Global", new_financiamentos_financing_configuration_path, class: "button"
          end
          div style: "margin-top: 10px" do
            link_to "Cadastrar Nova Opção", new_financiamentos_financing_option_path, class: "button"
          end
        end
      end
    end
  end
end
