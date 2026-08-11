# frozen_string_literal: true

# Central administrativa de reputação. Resources continuam separados por domínio.
ActiveAdmin.register_page 'Reputação' do
  menu priority: 5

  content title: 'Reputação' do
    tabs = [
      ['Visão Geral', admin_reputacao_path],
      ['Avaliações', admin_reviews_path],
      ['Moderação', admin_reviews_path(scope: 'pending')],
      ['Avaliações Setoriais', admin_sector_ratings_path],
      ['Configuração de Coleta', admin_review_forms_path]
    ]

    div class: 'reputation-hub-tabs', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;' do
      tabs.each_with_index do |(label, path), index|
        link_to label, path, class: "button #{index.zero? ? 'primary' : ''}"
      end
      nil
    end

    metric = lambda do |title, value, detail|
      panel title do
        h2 number_with_delimiter(value, delimiter: '.')
        span detail
      end
    end

    columns do
      column { metric.call('Avaliações aprovadas', Review.approved.count, 'Reputação orgânica publicada') }
      column { metric.call('Aguardando moderação', Review.pending.count, 'Avaliações pendentes') }
      column { metric.call('Em análise', Review.in_analysis.count, 'Fila de análise') }
      column { metric.call('Flagged / contestadas', Review.where(status: %i[flagged contested]).count, 'Filas de atenção') }
    end

    columns do
      column { metric.call('Avaliações recentes', Review.where(created_at: 30.days.ago..).count, 'Últimos 30 dias') }
      column { metric.call('Empresas avaliadas', Review.approved.distinct.count(:company_id), 'Com avaliação aprovada') }
      column { metric.call('Formulários ativos', ReviewForm.active.count, 'Configuração de coleta') }
      column { metric.call('Avaliações setoriais', SectorRating.count, 'Domínio separado') }
    end

    columns do
      column do
        panel 'Fila de moderação' do
          reviews = Review.where(status: %i[pending in_analysis flagged contested]).includes(:company).order(created_at: :desc).limit(10)
          if reviews.empty?
            para 'Nenhuma avaliação aguardando moderação.'
          else
            table_for reviews do
              column('Empresa') { |review| review.company ? link_to(review.company.name, admin_company_path(review.company)) : 'Empresa não vinculada' }
              column('Status') { |review| status_tag review.status }
              column :rating
              column :created_at
              column('Abrir') { |review| link_to 'Ver avaliação', admin_review_path(review) }
            end
          end
        end
      end

      column do
        panel 'Fontes canônicas' do
          para 'Nota: Review aprovada'
          para 'Agregado: ReviewAggregate'
          para 'Cache público: Company.rating_avg e Company.rating_count'
          para 'Trust Score: visão derivada, não é nota'
          para 'Ranking, badges e campanhas permanecem fora desta central'
        end
      end
    end

    panel 'Ações rápidas' do
      div style: 'display:flex;gap:8px;flex-wrap:wrap;' do
        link_to 'Ver avaliações', admin_reviews_path, class: 'button'
        link_to 'Ver setoriais', admin_sector_ratings_path, class: 'button'
        link_to 'Ver formulários', admin_review_forms_path, class: 'button'
      end
    end
  end
end
