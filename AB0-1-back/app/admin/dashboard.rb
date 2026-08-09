# frozen_string_literal: true

ActiveAdmin.register_page 'Dashboard' do
  menu priority: 1, label: proc { I18n.t('active_admin.dashboard') }

  content title: proc { I18n.t('active_admin.dashboard') } do
    # ----------------------------------------------------
    # AVALIA SOLAR ADS (PR 4)
    # ----------------------------------------------------
    h2 'Avalia Solar Ads', style: 'margin-top: 20px; border-bottom: 2px solid #ccc; padding-bottom: 5px;'
    
    columns do
      column do
        panel 'Banners Ativos' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 Banner.where(active: true).where(moderation_status: 'approved').count, style: 'font-size: 2.5em; margin-bottom: 10px;'
            span 'Em exibição'
          end
        end
      end
      column do
        panel 'Contratações Ativas' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            h1 BannerAddonSubscription.where(status: 'active').count, style: 'font-size: 2.5em; margin-bottom: 10px;'
            span 'Add-ons rodando'
          end
        end
      end
      column do
        panel 'Receita no Mês' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            cents = BannerAddonSubscription.where(status: ['active', 'expired']).where('created_at >= ?', Time.current.beginning_of_month).sum(:price_paid_cents)
            h1 number_to_currency(cents.to_f / 100, unit: 'R$ ', separator: ',', delimiter: '.'), style: 'font-size: 2.5em; margin-bottom: 10px; color: #4caf50;'
            span 'Faturamento Bruto'
          end
        end
      end
      column do
        panel 'Estatísticas Globais' do
          div class: 'dashboard-metric', style: 'text-align: center; padding: 20px;' do
            stats = BannerDailyStat.select('SUM(views_count) as v, SUM(clicks_count) as c, SUM(leads_count) as l').to_a.first
            v = stats.v.to_i
            c = stats.c.to_i
            l = stats.l.to_i
            ctr = v.positive? ? (c.to_f / v * 100).round(2) : 0.0
            
            div style: 'display: flex; justify-content: space-around; font-size: 1.1em;' do
              span "👁️ #{number_with_delimiter(v, delimiter: '.')}"
              span "🖱️ #{number_with_delimiter(c, delimiter: '.')}"
              span "🎯 #{ctr}% CTR"
              span "🔥 #{l} Leads"
            end
          end
        end
      end
    end

    columns do
      column do
        panel 'Contratações Vencendo (7 dias)' do
          expiring = BannerAddonSubscription.where(status: 'active')
                                            .where('ends_at BETWEEN ? AND ?', Time.current, 7.days.from_now)
                                            .order(ends_at: :asc)
                                            .limit(10)
          if expiring.any?
            table_for expiring do
              column :banner
              column :banner_addon
              column :company
              column :ends_at
              column '' do |sub|
                link_to 'Ver', admin_banner_addon_subscription_path(sub)
              end
            end
          else
            div 'Nenhuma contratação vencendo nos próximos 7 dias.', style: 'padding: 10px; color: #666;'
          end
        end
      end
      column do
        panel 'Banners Aguardando Moderação' do
          pending = Banner.where(moderation_status: 'submitted').order(updated_at: :desc).limit(10)
          if pending.any?
            table_for pending do
              column :title do |b|
                link_to b.title, admin_banner_path(b)
              end
              column :company
              column :created_at
            end
          else
            div 'Nenhum banner na fila de moderação.', style: 'padding: 10px; color: #666;'
          end
        end
      end
    end

    # ----------------------------------------------------
    # PLATAFORMA GERAL (Legacy Metrics)
    # ----------------------------------------------------
    h2 'Plataforma Geral', style: 'margin-top: 40px; border-bottom: 2px solid #ccc; padding-bottom: 5px;'

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
            begin
              h1 Lead.count, style: 'font-size: 3em; margin-bottom: 10px;'
            rescue StandardError
              h1 'N/A'
            end
            span 'Leads totais'
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
            div link_to 'Moderar Empresas', admin_companies_path(scope: 'pending_review'), class: 'button',
                                                                                           style: 'width: 100%; text-align: center;'
            div link_to 'Solicitações de Acesso', admin_company_access_requests_path(scope: 'pending'),
                        class: 'button', style: 'width: 100%; text-align: center;'
            div link_to 'Nova Categoria', new_admin_category_path, class: 'button',
                                                                   style: 'width: 100%; text-align: center;'
            div link_to 'Gerenciar Usuários', admin_users_path, class: 'button',
                                                                style: 'width: 100%; text-align: center;'
          end
        end
      end
    end
  end
end
