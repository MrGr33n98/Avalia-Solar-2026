# frozen_string_literal: true

# Console único de operação de publicidade. Resources antigos continuam registrados.
ActiveAdmin.register_page 'Publicidade & Campanhas' do
  menu priority: 4

  content title: 'Publicidade & Campanhas' do
    tabs = [
      ['Visão Geral', admin_publicidade_campanhas_path], ['Banners', admin_banners_path],
      ['Ofertas', admin_banner_offers_path], ['Assinaturas', admin_banner_subscriptions_path],
      ['Add-ons', admin_banner_addons_path], ['Contratações', admin_banner_addon_subscriptions_path],
      ['Auditoria', admin_banner_audit_logs_path], ['Campanhas', admin_campaigns_path],
      ['Avaliações', admin_campaign_reviews_path], ['Globais', admin_banner_globals_path],
      ['Patrocínio legado', admin_sponsored_plans_path]
    ]

    div class: 'advertising-console-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
    end

    columns do
      column do
        panel('Banners') { h2 number_with_delimiter(Banner.count, delimiter: '.'); span 'Criativos cadastrados' }
      end
      column do
        panel('Ativos') do
          h2 number_with_delimiter(Banner.where(active: true).count, delimiter: '.'); span 'Banners habilitados'
        end
      end
      column do
        panel('Assinaturas') do
          h2 number_with_delimiter(BannerSubscription.count, delimiter: '.'); span 'Contratos de mídia'
        end
      end
      column do
        panel('Eventos') do
          h2 number_with_delimiter(BannerEvent.count, delimiter: '.'); span 'Impressões e cliques registrados'
        end
      end
    end

    columns do
      column do
        panel 'Últimos banners' do
          table_for Banner.order(created_at: :desc).limit(10) do
            column :title
            column :company
            column :position
            column :moderation_status
            column :active
            column :created_at
            column('Abrir') { |banner| link_to 'Ver', admin_banner_path(banner) }
          end
        end
      end
      column do
        panel 'Ações rápidas' do
          div style: 'display:flex;flex-direction:column;gap:8px;' do
            link_to 'Gerenciar banners', admin_banners_path, class: 'button'
            link_to 'Ver assinaturas', admin_banner_subscriptions_path, class: 'button'
            link_to 'Ver auditoria', admin_banner_audit_logs_path, class: 'button'
          end
        end
      end
    end
  end
end
