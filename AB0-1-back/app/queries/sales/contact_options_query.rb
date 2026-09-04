# frozen_string_literal: true

module Sales
  class ContactOptionsQuery
    def self.call(account_id:, query: nil, limit: 20, scope: nil)
      return [] if account_id.blank?

      base_scope = scope || ::Sales::Contact.all
      contacts_scope = base_scope.where(sales_account_id: account_id)
                                 .select(:id, :first_name, :last_name, :email, :job_title)
      if query.present?
        q = "%#{query.to_s.downcase.strip}%"
        contacts_scope = contacts_scope.where('LOWER(first_name) LIKE :q OR LOWER(last_name) LIKE :q OR LOWER(email) LIKE :q', q: q)
      end
      contacts_scope.order(created_at: :desc).limit(limit)
    end
  end
end
