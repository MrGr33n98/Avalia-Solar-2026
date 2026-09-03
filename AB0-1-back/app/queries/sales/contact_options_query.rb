# frozen_string_literal: true

module Sales
  class ContactOptionsQuery
    def self.call(account_id:, query: nil, limit: 20)
      return [] if account_id.blank?

      scope = ::Sales::Contact.where(sales_account_id: account_id)
                              .select(:id, :first_name, :last_name, :email, :job_title)
      if query.present?
        q = "%#{query.to_s.downcase.strip}%"
        scope = scope.where('LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q OR LOWER(email) LIKE :q', q: q)
      end
      scope.order(created_at: :desc).limit(limit)
    end
  end
end
