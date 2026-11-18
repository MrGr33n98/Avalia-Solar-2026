# frozen_string_literal: true

module Gamification
  module Rules
    class PartnerReviewRule < BaseRule
      def evaluate(user)
        partner_review = user.reviews.where(status: :approved).joins(:company).detect do |rev|
          partner_company?(rev.company)
        end

        if partner_review
          fact_at = partner_review.approved_at || partner_review.updated_at || Time.current
          [true, fact_at]
        else
          [false, nil]
        end
      end

      private

      def partner_company?(comp)
        return false unless comp

        comp.verified? || comp.featured? || (comp.respond_to?(:has_paid_plan?) && comp.has_paid_plan?)
      end
    end
  end
end
