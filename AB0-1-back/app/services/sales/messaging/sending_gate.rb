# frozen_string_literal: true

module Sales
  module Messaging
    class SendingGate
      def self.enabled?
        ENV['SALES_EMAIL_SENDING_ENABLED'].to_s.casecmp('true').zero?
      end
    end
  end
end
