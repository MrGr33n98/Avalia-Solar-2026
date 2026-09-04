# frozen_string_literal: true

module Sales
  class AccountDuplicateDetector
    attr_reader :tenant_scope

    def initialize(tenant_scope = ::Sales::Account.all)
      @tenant_scope = tenant_scope
    end

    def self.call(tenant_scope = ::Sales::Account.all)
      new(tenant_scope).call
    end

    def call
      duplicate_groups = []

      # 1. Group by exact domain
      domain_groups = tenant_scope
                        .where.not(domain: [nil, ''])
                        .group(:domain)
                        .having('COUNT(*) > 1')
                        .pluck(:domain)

      domain_groups.each do |domain|
        accounts = tenant_scope.where(domain: domain).order(created_at: :asc)
        duplicate_groups << {
          reason: "Mesmo Domínio (#{domain})",
          master_account_id: accounts.first.id,
          accounts: serialize_accounts(accounts)
        }
      end

      # 2. Group by exact lower name
      name_groups = tenant_scope
                      .group('LOWER(name)')
                      .having('COUNT(*) > 1')
                      .pluck('LOWER(name)')

      name_groups.each do |name|
        accounts = tenant_scope.where('LOWER(name) = ?', name).order(created_at: :asc)
        # Avoid duplicate groups if already captured by domain
        next if duplicate_groups.any? { |g| (g[:accounts].map { |a| a[:id] } & accounts.pluck(:id)).size > 1 }

        duplicate_groups << {
          reason: "Mesmo Nome Comercial (#{accounts.first.name})",
          master_account_id: accounts.first.id,
          accounts: serialize_accounts(accounts)
        }
      end

      { duplicate_groups: duplicate_groups, total_groups: duplicate_groups.size }
    end

    private

    def serialize_accounts(accounts)
      accounts.map do |acc|
        {
          id: acc.id,
          name: acc.name,
          domain: acc.domain,
          city: acc.city,
          state: acc.state,
          created_at: acc.created_at,
          owner_name: acc.owner&.name || 'Vendedor Interno',
          contacts_count: acc.contacts.size,
          opps_count: acc.opportunities.size
        }
      end
    end
  end
end
