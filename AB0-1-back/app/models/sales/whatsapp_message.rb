# frozen_string_literal: true

module Sales
  class WhatsappMessage < ApplicationRecord
    self.table_name = 'sales_whatsapp_messages'

    belongs_to :thread, class_name: 'Sales::WhatsappThread',
               foreign_key: :sales_whatsapp_thread_id

    validates :provider_message_id, :message_type, :intent, :occurred_at, presence: true
    validates :direction, inclusion: { in: %w[inbound outbound] }
    validates :provider_message_id, uniqueness: { scope: :sales_whatsapp_thread_id }
  end
end
