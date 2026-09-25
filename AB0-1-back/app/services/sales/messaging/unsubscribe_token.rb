# frozen_string_literal: true

module Sales
  module Messaging
    class UnsubscribeToken
      PURPOSE = 'sales_email_unsubscribe'
      EXPIRES_IN = 90.days

      def self.generate(email_message)
        Rails.application.message_verifier('sales-email-unsubscribe').generate(
          { email_message_id: email_message.id, company_id: email_message.company_id },
          purpose: PURPOSE,
          expires_in: EXPIRES_IN
        )
      end

      def self.verify(token)
        Rails.application.message_verifier('sales-email-unsubscribe').verified(token, purpose: PURPOSE)
      end
    end
  end
end
