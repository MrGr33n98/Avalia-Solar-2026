# frozen_string_literal: true

module Gamification
  module Rules
    class Registry
      RULES = {
        'review_approved_1' => ReviewApprovedCountRule,
        'review_approved_3' => ReviewApprovedCountRule,
        'review_approved_5' => ReviewApprovedCountRule,
        'profile_complete' => ProfileCompleteRule,
        'avatar_uploaded' => AvatarUploadedRule,
        'solution_added_1' => SolutionAddedCountRule,
        'solution_added_5' => SolutionAddedCountRule,
        'review_useful_1' => ReviewUsefulVoteRule,
        'category_pioneer_1' => CategoryPioneerRule,
        'review_verified_1' => ReviewVerifiedCustomerRule,
        'partner_review_1' => PartnerReviewRule,
        'first_ten' => FirstTenRule,
        'answer_published_1' => AnswerPublishedRule,
        'solar_plant_complete' => SolarPlantCompleteRule
      }.freeze

      def self.for(badge)
        RULES[badge.slug]&.new(badge)
      end
    end
  end
end
