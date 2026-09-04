module Sales
  module Messaging
    class SuppressionChecker
      def self.blocked?(company_id:, email:)
        Sales::EmailSuppression.exists?(company_id: company_id, email: email.to_s.strip.downcase)
      end
    end
  end
end
