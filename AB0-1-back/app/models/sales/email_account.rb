# frozen_string_literal: true

module Sales
  class EmailAccount < ApplicationRecord
    self.table_name = 'sales_email_accounts'

    PROVIDERS = %w[ses google microsoft zoho].freeze
    SYNC_STATUSES = %w[idle syncing healthy degraded error].freeze
    CONNECTION_STATUSES = %w[pending healthy needs_reconnect paused disconnected].freeze

    belongs_to :company
    belongs_to :user

    has_many :email_messages, class_name: 'Sales::EmailMessage', foreign_key: :sales_email_account_id, dependent: :nullify
    has_many :email_threads, class_name: 'Sales::EmailThread', foreign_key: :sales_email_account_id, dependent: :nullify
    has_many :email_signatures, class_name: 'Sales::EmailSignature', foreign_key: :sales_email_account_id, dependent: :destroy
    has_many :sync_states, class_name: 'Sales::EmailSyncState', foreign_key: :sales_email_account_id, dependent: :destroy

    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :provider, presence: true, inclusion: { in: PROVIDERS }

    scope :active, -> { where(sync_status: %w[idle syncing healthy]) }
    scope :connected, -> { where(connection_status: 'healthy') }
    scope :for_user, ->(user) { where(company_id: user.company_id, user_id: user.id) }

    def zoho?
      provider == 'zoho'
    end

    def has_refresh_token?
      refresh_token_encrypted.present?
    end

    # Expiração de access token (~1h) é normal no ciclo OAuth; não requer reconexão manual.
    def access_token_refresh_due?
      return false unless access_token_expires_at

      access_token_expires_at <= 5.minutes.from_now
    end
    alias token_expired? access_token_refresh_due?

    # Reconexão humana exigida apenas quando refresh token foi revogado ou ausente.
    def needs_reconnect?
      connection_status == 'needs_reconnect' || refresh_token_encrypted.blank?
    end

    def disconnect!
      update!(
        access_token_encrypted: nil,
        refresh_token_encrypted: nil,
        connection_status: 'disconnected',
        sync_status: 'idle',
        sync_error: nil
      )
    end
  end
end
