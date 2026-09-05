module Sales
  module Messaging
    class SuppressionChecker
      def self.blocked?(company_id:, email:)
        return false if company_id.blank? || email.blank?

        Sales::EmailSuppression.where(company_id: company_id)
          .where('LOWER(email) = ?', email.to_s.strip.downcase)
          .exists?
      end
    end
  end
end
