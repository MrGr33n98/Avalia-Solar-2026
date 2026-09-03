# frozen_string_literal: true

module Sales
  class AccountOptionsQuery
    def self.call(query: nil, limit: 20)
      scope = ::Sales::Account.select(:id, :name, :domain)
      if query.present?
        q = "%#{query.to_s.downcase.strip}%"
        scope = scope.where('LOWER(name) LIKE :q OR LOWER(domain) LIKE :q', q: q)
      end
      scope.order(created_at: :desc).limit(limit)
    end
  end
end
