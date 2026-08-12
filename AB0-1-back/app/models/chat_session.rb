# frozen_string_literal: true

class ChatSession < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :company, optional: true
  belongs_to :assigned_agent, class_name: 'User', optional: true
  has_many :chat_messages, dependent: :destroy
  has_one :chat_lead, dependent: :destroy

  MODES = %w[bot_only human_manual hybrid].freeze

  enum status: {
    active: 'active',
    ended: 'ended',
    abandoned: 'abandoned'
  }, _prefix: true

  enum inbox_status: {
    active: 'active',
    waiting_agent: 'waiting_agent',
    in_progress: 'in_progress',
    archived: 'archived'
  }, _prefix: true

  validates :visitor_id, presence: true
  validates :visitor_nonce, presence: true, uniqueness: true
  validates :mode, inclusion: { in: MODES }

  before_validation :generate_visitor_id, on: :create
  before_validation :generate_visitor_nonce, on: :create
  before_create :set_started_at

  scope :recent, -> { order(created_at: :desc) }
  scope :with_leads, -> { joins(:chat_lead) }
  scope :by_vertical, ->(v) { where(vertical: v) if v.present? }
  scope :by_source, ->(s) { where(source_page: s) if s.present? }
  scope :for_inbox, -> { where.not(company_id: nil).where.not(inbox_status: 'archived') }
  scope :inbox_recent, -> { order(Arel.sql('COALESCE(last_message_at, created_at) DESC')) }

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

  def waiting_for_agent?
    inbox_status == 'waiting_agent'
  end

  def bot_may_respond?
    mode != 'human_manual'
  end

  def request_human!(company: self.company)
    update!(
      company: company,
      mode: mode == 'bot_only' ? 'hybrid' : mode,
      inbox_status: 'waiting_agent',
      human_requested_at: human_requested_at || Time.current
    )
  end

  def take_over!(agent:)
    update!(
      assigned_agent: agent,
      mode: 'human_manual',
      inbox_status: 'in_progress',
      human_taken_over_at: human_taken_over_at || Time.current
    )
  end

  def return_to_bot!
    update!(assigned_agent: nil, mode: 'bot_only', inbox_status: 'active')
  end

  def archive!
    update!(inbox_status: 'archived', archived_at: Time.current, company_unread_count: 0)
  end

  private

  def set_started_at
    self.started_at ||= Time.current
  end

  def generate_visitor_id
    self.visitor_id ||= SecureRandom.uuid
  end

  def generate_visitor_nonce
    self.visitor_nonce ||= SecureRandom.hex(32)
  end
end
