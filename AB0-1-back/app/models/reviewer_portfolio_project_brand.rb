# frozen_string_literal: true

class ReviewerPortfolioProjectBrand < ApplicationRecord
  belongs_to :reviewer_portfolio_project
  belongs_to :reviewer_brand_usage

  validates :reviewer_portfolio_project_id,
            uniqueness: { scope: :reviewer_brand_usage_id, message: 'marca já vinculada a este projeto' }

  validate :brand_usage_must_belong_to_same_user

  private

  def brand_usage_must_belong_to_same_user
    return unless reviewer_portfolio_project && reviewer_brand_usage

    if reviewer_portfolio_project.user_id != reviewer_brand_usage.user_id
      errors.add(:reviewer_brand_usage_id, 'não pertence ao mesmo proprietário do projeto')
    end
  end
end
