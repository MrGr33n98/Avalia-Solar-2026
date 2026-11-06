# frozen_string_literal: true

# Durable change history for commercial plan settings.
class PlanConfigurationAudit < ApplicationRecord
  belongs_to :plan, optional: true
  belongs_to :admin_user, optional: true

  validates :before_state, :after_state, presence: true
end
