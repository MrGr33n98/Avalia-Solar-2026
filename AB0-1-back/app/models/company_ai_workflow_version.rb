# frozen_string_literal: true

class CompanyAiWorkflowVersion < ApplicationRecord
  belongs_to :company_ai_assistant
  validates :version_number, presence: true, numericality: { only_integer: true, greater_than: 0 },
                             uniqueness: { scope: :company_ai_assistant_id }
  validates :status, inclusion: { in: %w[draft published archived] }
  validate :published_graph_is_valid
  validate :immutable_published_definition, on: :update

  scope :published, -> { where(status: 'published') }

  private

  def published_graph_is_valid
    return unless status == 'published'

    result = CompanyAi::WorkflowValidator.call(definition)
    errors.add(:definition, result.errors.join(', ')) unless result.valid?
  end

  def immutable_published_definition
    return unless status_in_database == 'published'
    errors.add(:definition, 'published definitions are immutable') if will_save_change_to_definition?
    errors.add(:status, 'cannot return to draft') if status == 'draft'
  end
end
