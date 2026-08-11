# frozen_string_literal: true

# Central administrativa do domínio Empresa. Resources filhos continuam registrados.
ActiveAdmin.register_page 'Empresas' do
  menu priority: 2

  content title: 'Empresas' do
    tabs = [
      ['Visão Geral', admin_empresas_path], ['Todas as Empresas', admin_companies_path],
      ['Produtos', admin_company_products_path], ['Projetos', admin_company_projects_path],
      ['Serviços', admin_company_services_path], ['Materiais', admin_company_materials_path],
      ['Solicitações de Acesso', admin_company_access_requests_path], ['Membros', admin_company_members_path]
    ]

    div class: 'companies-hub-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
    end

    columns do
      column { panel('Empresas') { h2 number_with_delimiter(Company.count, delimiter: '.'); span 'Cadastros totais' } }
      column do
        panel('Ativas') do
          h2 number_with_delimiter(Company.where(status: 'active').count, delimiter: '.')
          span 'Empresas publicadas'
        end
      end
      column do
        panel('Verificadas') do
          h2 number_with_delimiter(Company.where(verified: true).count, delimiter: '.')
          span 'Empresas verificadas'
        end
      end
      column do
        panel 'Solicitações pendentes' do
          h2 number_with_delimiter(CompanyAccessRequest.pending.count, delimiter: '.')
          span 'Acessos aguardando análise'
        end
      end
    end

    columns do
      column do
        panel 'Empresas atualizadas recentemente' do
          table_for Company.order(updated_at: :desc).limit(10) do
            column :name
            column :status
            column :verified
            column :city
            column :state
            column :updated_at
            column('Abrir') { |company| link_to 'Empresa 360', admin_company_path(company) }
          end
        end
      end
      column do
        panel 'Ações rápidas' do
          div style: 'display:flex;flex-direction:column;gap:8px;' do
            link_to 'Nova empresa', new_admin_company_path, class: 'button'
            link_to 'Revisar empresas', admin_companies_path(scope: 'pending_review'), class: 'button'
            link_to 'Ver solicitações', admin_company_access_requests_path(scope: 'pending'), class: 'button'
            link_to 'Importar empresas', import_csv_form_admin_companies_path, class: 'button'
          end
        end
      end
    end
  end
end
