ActiveAdmin.register_page 'Operações de reviewers' do
  menu label: 'Visão geral reviewers', parent: 'Reviews', priority: 1

  content title: 'Operações de reviewers' do
    reviewers = User.where(role: 'review')
    reviews = Review.where(user_id: reviewers.select(:id))
    solutions = ReviewerSolution.where(user_id: reviewers.select(:id))
    pending = solutions.where(verified: false).count
    avg_score = if reviewers.exists?
                  total_reviews = Review.where(user_id: reviewers.select(:id)).count
                  total_helpful = ReviewVote.joins(:review).where(vote_type: 'useful', reviews: { user_id: reviewers.select(:id) }).count
                  profile_points = reviewers.sum("CASE WHEN name IS NOT NULL AND name != '' THEN 20 ELSE 0 END + CASE WHEN city IS NOT NULL AND city != '' THEN 20 ELSE 0 END + CASE WHEN state IS NOT NULL AND state != '' THEN 20 ELSE 0 END")
                  ((total_reviews * 35) + (total_helpful * 2) + profile_points).fdiv(reviewers.count).round(2)
                else
                  'Indisponível'
                end

    columns do
      column { panel('Reviewers') { para reviewers.count } }
      column { panel('Avaliações') { para reviews.count } }
      column { panel('Avaliações pendentes') { para reviews.where(status: %w[pending in_analysis]).count } }
    end

    columns do
      column { panel('Soluções') { para solutions.count } }
      column { panel('Verificações pendentes') { para pending } }
      column { panel('Green Score médio') { para avg_score } }
    end
  end
end
