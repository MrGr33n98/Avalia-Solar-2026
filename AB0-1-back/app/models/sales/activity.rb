# frozen_string_literal: true

module Sales
  class Activity < ApplicationRecord
    self.table_name = 'sales_activities'

    ACTIVITY_TYPES = %w[
      call
      meeting
      virtual_meeting
      voicemail
      visit
      note
      email
      task
      whatsapp
    ].freeze

    LOG_STATUSES = %w[
      completed
      scheduled
      cancelled
    ].freeze

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    belongs_to :actor, class_name: 'User'

    validates :activity_type, :occurred_at, presence: true
    validates :activity_type, inclusion: { in: ACTIVITY_TYPES }, allow_blank: true
    validates :log_status, inclusion: { in: LOG_STATUSES }, allow_blank: true

    scope :completed, -> { where(log_status: 'completed') }
    scope :scheduled, -> { where(log_status: 'scheduled') }
    scope :cancelled, -> { where(log_status: 'cancelled') }
    scope :with_duration, -> { where.not(duration_seconds: nil) }
    scope :with_notes, -> { where.not(body: [nil, '']) }
    scope :ai_summarized, -> { where("metadata->>'ai_summary' IS NOT NULL") }
  end
end
