ActiveAdmin.register_page 'Operações de reviewers' do
  menu label: 'Visão geral reviewers', parent: 'Reviews', priority: 1

  content title: 'Operações de reviewers' do
    reviewers = User.where(role: 'review')
    reviewer_ids = reviewers.select(:id)
    reviews = Review.where(user_id: reviewer_ids)
    solutions = ReviewerSolution.where(user_id: reviewer_ids)
    publications = ReviewerPublication.where(user_id: reviewer_ids)
    comments = ReviewerPublicationComment.where(reviewer_publication_id: publications.select(:id))
    publication_events = ReviewerPublicationEvent.where(reviewer_publication_id: publications.select(:id))
    pending_solutions = solutions.where(verified: false).where.not(status: 'disabled')
    moderation_reviews = reviews.where(status: %i[pending in_analysis flagged contested])
    score_values = reviewers.find_each.sum do |reviewer|
      Reviewer::GreenScoreService.new(user: reviewer).call.fetch(:score)
    end
    avg_score = reviewers.exists? ? (score_values.fdiv(reviewers.count)).round(2) : 'Indisponível'

    metric = lambda do |title, value, detail|
      panel title do
        h2 number_with_delimiter(value, delimiter: '.')
        span detail
      end
    end

    columns do
      column { metric.call('Reviewers', reviewers.count, 'Usuários com papel review') }
      column { metric.call('Avaliações', reviews.count, 'Todas as avaliações próprias') }
      column { metric.call('Fila de moderação', moderation_reviews.count, 'Pendentes, análise ou contestadas') }
    end

    columns do
      column { metric.call('Soluções', solutions.count, 'Inclui ativas, rejeitadas e desativadas') }
      column { metric.call('Verificações pendentes', pending_solutions.count, 'Soluções não verificadas e operacionais') }
      column { metric.call('Publicações', publications.count, 'Conteúdo de reviewers') }
      column { metric.call('Green Score médio', avg_score, 'Derivado do serviço versionado') }
    end

    columns do
      column { metric.call('Visualizações', publication_events.where(event_name: 'publication_view').count, 'Publicações de reviewers') }
      column { metric.call('Comentários ativos', comments.where(status: 'active').count, 'Comentários visíveis') }
      column { metric.call('Publicações pendentes', publications.where(status: 'draft').count, 'Rascunhos aguardando publicação') }
    end

    columns do
      column do
        panel 'Fila de moderação de avaliações' do
          if moderation_reviews.exists?
            table_for moderation_reviews.includes(:user, :company).order(created_at: :asc).limit(10) do
              column('Reviewer') { |review| review.user ? link_to(review.user.email, admin_user_path(review.user)) : 'Usuário removido' }
              column('Empresa') { |review| review.company&.name || 'Empresa não vinculada' }
              column('Status') { |review| status_tag review.status }
              column :rating
              column :created_at
              column('Abrir') { |review| link_to 'Ver avaliação', admin_review_path(review) }
            end
          else
            para 'Nenhuma avaliação aguardando moderação.'
          end
        end
      end

      column do
        panel 'Soluções aguardando verificação' do
          if pending_solutions.exists?
            table_for pending_solutions.includes(:user).order(created_at: :asc).limit(10) do
              column('Reviewer') { |solution| solution.user ? link_to(solution.user.email, admin_user_path(solution.user)) : 'Usuário removido' }
              column('Solução') { |solution| link_to solution.name, admin_reviewer_solution_path(solution) }
              column :category
              column :created_at
            end
          else
            para 'Nenhuma solução aguardando verificação.'
          end
        end
      end
    end

    columns do
      column do
        panel 'Publicações recentes' do
          recent_publications = publications.includes(:user).order(created_at: :desc).limit(10)
          if recent_publications.exists?
            table_for recent_publications do
              column('Reviewer') { |publication| publication.user&.email || 'Usuário removido' }
              column('Título') { |publication| link_to publication.title, admin_reviewer_publication_path(publication) }
              column('Status') { |publication| status_tag publication.status }
              column :created_at
            end
          else
            para 'Nenhuma publicação cadastrada.'
          end
        end
      end

      column do
        panel 'Ações rápidas' do
          div style: 'display:flex;gap:8px;flex-wrap:wrap;' do
            link_to 'Avaliações', admin_reviews_path, class: 'button'
            link_to 'Soluções', admin_reviewer_solutions_path, class: 'button'
            link_to 'Publicações', admin_reviewer_publications_path, class: 'button'
            link_to 'Perfis', admin_reviewer_profiles_path, class: 'button'
          end
        end
      end
    end
  end
end
