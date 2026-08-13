# frozen_string_literal: true

module Reviewer
  class AchievementService
    DEFINITIONS = [
      { id: 'first_review', title: 'Primeira avaliação', description: 'Publique sua primeira avaliação.', points: 50, target: 1 },
      { id: 'three_reviews', title: 'Avaliador consciente', description: 'Publique três avaliações.', points: 100, target: 3 }
    ].freeze

    def initialize(user:)
      @user = user
    end

    def call
      approved_reviews = @user.reviews.where(status: :approved).order(:created_at)
      review_count = approved_reviews.count
      DEFINITIONS.map do |definition|
        progress = [review_count, definition[:target]].min
        unlocked = review_count >= definition[:target]
        definition.merge(
          subtitle: definition[:description], state: unlocked ? 'desbloqueado' : 'bloqueado',
          unlocked: unlocked, progress: progress, xp: unlocked ? definition[:points] : 0,
          unlocked_at: unlocked ? approved_reviews[definition[:target] - 1]&.created_at&.iso8601 : nil
        )
      end
    end
  end
end
