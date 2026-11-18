# frozen_string_literal: true

class ReviewerBrandUsageEvent < ApplicationRecord
  belongs_to :reviewer_brand_usage
  belongs_to :actor, class_name: 'User', optional: true

  validates :action, presence: true
end
