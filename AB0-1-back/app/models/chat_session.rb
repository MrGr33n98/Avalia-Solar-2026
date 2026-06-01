# frozen_string_literal: true

class ChatSession < ApplicationRecord
  belongs_to :user, optional: true
  has_many :chat_messages, dependent: :destroy
  has_one :chat_lead, dependent: :destroy

  enum status: {
    active: 'active',
    ended: 'ended',
    abandoned: 'abandoned'
  }, _prefix: true

  validates :visitor_id, presence: true

  before_validation :generate_visitor_id, on: :create
  before_create :set_started_at

  scope :recent, -> { order(created_at: :desc) }
  scope :with_leads, -> { joins(:chat_lead) }
  scope :by_vertical, ->(v) { where(vertical: v) if v.present? }
  scope :by_source, ->(s) { where(source_page: s) if s.present? }

  def self.ransackable_attributes(_auth_object = nil)
    %w[
      id visitor_id user_id page_url source_page referrer
      utm_source utm_medium utm_campaign vertical status
      started_at ended_at last_message_at message_count
      created_at updated_at
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[user chat_messages chat_lead]
  end

  def end_session!
    update!(status: 'ended', ended_at: Time.current)
  end

  def increment_message_count!
    increment!(:message_count)
    touch(:last_message_at)
  end

  private

  def set_started_at
    self.started_at ||= Time.current
  end

  def generate_visitor_id
    self.visitor_id ||= SecureRandom.uuid
  end
end
