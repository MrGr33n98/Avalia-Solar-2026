# frozen_string_literal: true

class ReviewerPortfolioProjectEvent < ApplicationRecord
  belongs_to :reviewer_portfolio_project
  belongs_to :actor, class_name: 'User'

  ACTIONS = %w[created updated visibility_changed image_attached image_removed disabled reactivated].freeze

  validates :action, presence: true, inclusion: { in: ACTIONS }
end
