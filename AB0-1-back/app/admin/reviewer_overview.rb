ActiveAdmin.register_page 'Operações de reviewers' do
  menu label: 'Visão geral reviewers', parent: 'Reviews', priority: 1

  content title: 'Operações de reviewers' do
    reviewers = User.where(role: 'review')
    reviews = Review.where(user_id: reviewers.select(:id))
    solutions = ReviewerSolution.where(user_id: reviewers.select(:id))
    pending = solutions.where(verified: false).count
    scores = reviewers.filter_map(&:calculate_green_score)

    columns do
      column { panel('Reviewers') { para reviewers.count } }
      column { panel('Avaliações') { para reviews.count } }
      column { panel('Avaliações pendentes') { para reviews.where(status: %w[pending in_analysis]).count } }
    end

    columns do
      column { panel('Soluções') { para solutions.count } }
      column { panel('Verificações pendentes') { para pending } }
      column { panel('Green Score médio') { para scores.empty? ? 'Indisponível' : scores.sum.fdiv(scores.length).round(2) } }
    end
  end
end
