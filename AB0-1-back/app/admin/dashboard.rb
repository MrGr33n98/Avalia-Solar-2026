# frozen_string_literal: true

ActiveAdmin.register_page 'Dashboard' do
  menu priority: 1, label: proc { I18n.t('active_admin.dashboard') }

  content title: proc { I18n.t('active_admin.dashboard') } do
    
    # Metrics Cards
    columns do
      column do
        panel 'Total de Empresas' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 Company.count, style: 'font-size: 3em; margin-bottom: 10px;'
            span 'Empresas cadastradas'
          end
        end
      end
      column do
        panel 'Aguardando Aprovação' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 Company.pending_review.count, style: 'font-size: 3em; margin-bottom: 10px; color: orange;'
            span 'Empresas pendentes', class: 'status_tag pending'
          end
        end
      end
      column do
        panel 'Solicitações de Acesso' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 CompanyAccessRequest.pending.count, style: 'font-size: 3em; margin-bottom: 10px; color: #2196F3;'
            span 'Acessos pendentes', class: 'status_tag pending'
          end
        end
      end
      column do
        panel 'Total de Usuários' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 User.count, style: 'font-size: 3em; margin-bottom: 10px;'
            span 'Usuários registrados'
          end
        end
      end
      column do
        panel 'Leads Gerados' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 Lead.count, style: 'font-size: 3em; margin-bottom: 10px;' rescue h1 'N/A'
            span 'Leads totais'
          end
        end
      end
    end

    # Charts & Lists
    columns do
      column do
        panel 'Solicitações de Acesso Pendentes' do
          table_for CompanyAccessRequest.pending.order(created_at: :desc).limit(10) do
            column :user
            column :company
            column :requested_at
            column '' do |request|
              link_to 'Ver Solicitação', admin_company_access_request_path(request), class: 'button'
            end
          end
        end
      end
    end

    columns do
      column do
        panel 'Empresas Recentes' do
          table_for Company.order(created_at: :desc).limit(10) do
            column :name do |company|
              link_to company.name, admin_company_path(company)
            end
            column :created_at
            column :status do |company|
              status_tag company.status
            end
            column :moderation_status do |company|
              status_tag company.moderation_status, class: "status_#{company.moderation_status}"
            end
          end
        end
      end

      column do
        panel 'Ações Rápidas' do
          div class: 'quick-actions', style: 'display: flex; flex-direction: column; gap: 10px; padding: 20px;' do
            div link_to 'Moderar Empresas', admin_companies_path(scope: 'pending_review'), class: 'button', style: 'width: 100%; text-align: center;'
            div link_to 'Solicitações de Acesso', admin_company_access_requests_path(scope: 'pending'), class: 'button', style: 'width: 100%; text-align: center;'
            div link_to 'Nova Categoria', new_admin_category_path, class: 'button', style: 'width: 100%; text-align: center;'
            div link_to 'Gerenciar Usuários', admin_users_path, class: 'button', style: 'width: 100%; text-align: center;'
          end
        end
      end
    end
  end
end
