module Sales
  class EmailSuppression < ApplicationRecord
    self.table_name = 'sales_email_suppressions'

    belongs_to :company

    before_validation :normalize_email
    validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :email, uniqueness: { scope: :company_id }
    validates :reason, inclusion: { in: %w[bounce complaint unsubscribe manual] }

    def email=(value)
      super(value.to_s.strip.downcase)
    end

    private

    def normalize_email
      self.email = email.to_s.strip.downcase
    end
  end
end
