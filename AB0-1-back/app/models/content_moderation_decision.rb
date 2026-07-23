# frozen_string_literal: true

class ContentModerationDecision < ApplicationRecord
  DECISIONS = %w[approved rejected changes_requested quarantined].freeze

  belongs_to :company
  belongs_to :moderatable, polymorphic: true
  belongs_to :admin_user, optional: true

  validates :decision, inclusion: { in: DECISIONS }
  validates :reason, presence: true, if: -> { decision.in?(%w[rejected changes_requested quarantined]) }

  def self.ransackable_attributes(_auth_object = nil)
    %w[id company_id admin_user_id moderatable_type moderatable_id decision reason created_at updated_at]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[company admin_user moderatable]
  end
end
