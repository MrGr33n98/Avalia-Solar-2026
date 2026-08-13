# frozen_string_literal: true

module Reviewer
  class AchievementService
    def initialize(user:)
      @user = user
    end

    def call
      review_count = @user.reviews.count
      [
        achievement('first_review', 'Primeira avaliação', 'Publique sua primeira avaliação.', review_count >= 1),
        achievement('three_reviews', 'Avaliador consciente', 'Publique três avaliações.', review_count >= 3)
      ]
    end

    private

    def achievement(code, name, description, unlocked)
      { code: code, name: name, description: description, unlocked: unlocked }
    end
  end
end
