# frozen_string_literal: true

class CompanyAiAssistant < ApplicationRecord
  belongs_to :company
  has_many :workflow_versions, class_name: 'CompanyAiWorkflowVersion', dependent: :restrict_with_error
  has_many :audit_events, class_name: 'CompanyAiAuditEvent', dependent: :restrict_with_error

  validates :company_id, uniqueness: true
  validates :greeting, presence: true, length: { maximum: 160 }
  validates :timezone, presence: true
  validate :calendar_is_valid

  def published_workflow
    workflow_versions.find_by(id: active_version_id, status: 'published')
  end

  private

  def calendar_is_valid
    CompanyAi::BusinessCalendar.new(
      'timezone' => timezone, 'weekly' => weekly_hours, 'exceptions' => exceptions
    )
  rescue ArgumentError => e
    errors.add(:weekly_hours, e.message)
  end
end
