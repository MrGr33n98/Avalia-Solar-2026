module Sales
  module Accounts
    class CreateFromCompany
      def self.call(company:, owner:)
        account = ::Sales::Account.find_or_initialize_by(company:)
        account.owner ||= owner
        account.name = company.name if account.name.blank?
        account.domain ||= company.try(:website)
        account.save!
        DomainEvent.create!(event_type: 'sales.account.linked_to_company', aggregate_type: account.class.name,
                            aggregate_id: account.id, occurred_at: Time.current,
                            payload: { account_id: account.id, company_id: company.id, actor_id: owner.id }) if account.previously_new_record?
        account
      end
    end
  end
end
