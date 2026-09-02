module Sales
  class EmailMessage < ApplicationRecord
    self.table_name = 'sales_email_messages'

    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id
    belongs_to :opportunity, class_name: 'Sales::Opportunity', foreign_key: :sales_opportunity_id, optional: true
    belongs_to :sender_user, class_name: 'User', foreign_key: :sender_user_id

    has_many :events, class_name: 'Sales::EmailEvent', foreign_key: :sales_email_message_id, dependent: :destroy

    STATUSES = %w[draft queued sent delivered bounced failed].freeze

    validates :status, inclusion: { in: STATUSES }
    validates :from_email, presence: true
    validates :to_email, presence: true
    validates :subject, presence: true

    scope :queued, -> { where(status: 'queued') }
    scope :sent, -> { where(status: 'sent') }
    scope :delivered, -> { where(status: 'delivered') }

    def register_event!(event_type:, provider_event_id: nil, url: nil, user_agent: nil, occurred_at: Time.current, payload: {})
      return if provider_event_id.present? && events.exists?(provider_event_id: provider_event_id)

      events.create!(
        event_type: event_type,
        provider_event_id: provider_event_id,
        url: url,
        user_agent: user_agent,
        occurred_at: occurred_at,
        payload: payload
      )

      case event_type.to_s
      when 'delivered'
        update!(status: 'delivered', delivered_at: occurred_at)
      when 'bounce'
        update!(status: 'bounced', bounced_at: occurred_at)
      when 'open'
        increment!(:open_count)
        update!(first_opened_at: first_opened_at || occurred_at, last_opened_at: occurred_at)
      when 'click'
        increment!(:click_count)
        update!(first_clicked_at: first_clicked_at || occurred_at, last_clicked_at: occurred_at)
      end
    end
  end
end
