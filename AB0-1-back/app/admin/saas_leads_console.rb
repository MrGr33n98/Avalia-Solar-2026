# frozen_string_literal: true

# Console único de operação de leads. Resources continuam registrados para preservar rotas.
ActiveAdmin.register_page 'SaaS Leads' do
  menu priority: 3

  content title: 'SaaS Leads' do
    tabs = [
      ['Visão Geral', admin_saas_leads_path],
      ['Leads', admin_leads_path],
      ['Distribuição', admin_lead_distributions_path],
      ['Conteúdo', admin_content_leads_path],
      ['Formulários', admin_content_lead_forms_path],
      ['Exportações', admin_content_lead_exports_path],
      ['Chat IA', admin_chat_leads_path],
      ['Sessões', admin_chat_sessions_path],
      ['Wizards', admin_lead_wizard_versions_path]
    ]

    div class: 'saas-leads-console-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    columns do
      column do
        panel 'Leads totais' do
          h2 number_with_delimiter(Lead.count, delimiter: '.')
          span 'Registros comerciais'
        end
      end
      column do
        panel 'Novos hoje' do
          h2 number_with_delimiter(Lead.where(created_at: Time.current.all_day).count, delimiter: '.')
          span 'Captações nas últimas 24 horas'
        end
      end
      column do
        panel 'Leads quentes' do
          h2 number_with_delimiter(Lead.where('cached_score >= ?', 70).count, delimiter: '.')
          span 'Score igual ou acima de 70'
        end
      end
      column do
        panel 'Distribuições' do
          h2 number_with_delimiter(LeadDistribution.count, delimiter: '.')
          span 'Encaminhamentos registrados'
        end
      end
    end

    columns do
      column do
        panel 'Últimos leads' do
          table_for Lead.order(created_at: :desc).limit(10) do
            column :name
            column :email
            column :source
            column :wizard_status
            column :created_at
            column('Abrir') { |lead| link_to 'Ver', admin_lead_path(lead) }
          end
        end
      end
      column do
        panel 'Ações rápidas' do
          div style: 'display:flex;flex-direction:column;gap:8px;' do
            link_to 'Abrir leads', admin_leads_path, class: 'button'
            link_to 'Ver distribuição', admin_lead_distributions_path, class: 'button'
            link_to 'Configurar wizard', admin_lead_wizard_versions_path, class: 'button'
          end
        end
      end
    end
  end
end
