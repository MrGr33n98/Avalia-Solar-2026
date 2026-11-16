# frozen_string_literal: true

module Sales
  class WhatsappThread < ApplicationRecord
    self.table_name = 'sales_whatsapp_threads'

    belongs_to :company
    belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id, optional: true
    belongs_to :contact, class_name: 'Sales::Contact', foreign_key: :sales_contact_id, optional: true
    has_many :messages, class_name: 'Sales::WhatsappMessage',
             foreign_key: :sales_whatsapp_thread_id, dependent: :destroy

    validates :provider, :contact_hash, :status, presence: true
    validates :contact_hash, length: { is: 64 }
    validates :status, inclusion: { in: %w[open resolved] }

    scope :recent, -> { order(last_message_at: :desc, id: :desc) }
  end
end
