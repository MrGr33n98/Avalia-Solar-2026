# frozen_string_literal: true

module Sales
  module EmailSync
    class CrmMessageMatcher
      def self.match(company_id:, email_address:)
        return {} if email_address.blank?

        clean_email = email_address.to_s.downcase.strip

        # 1. Look up contact
        contact = Sales::Contact.joins(:account)
                               .where(sales_accounts: { company_id: company_id })
                               .where('LOWER(sales_contacts.email) = ?', clean_email)
                               .first

        if contact
          account = contact.account
          opp = contact.opportunities.order(created_at: :desc).first ||
                account&.opportunities&.order(created_at: :desc)&.first
          return {
            contact_id: contact.id,
            account_id: account&.id,
            opportunity_id: opp&.id
          }
        end

        # 2. Look up account by domain or email
        account = Sales::Account.where(company_id: company_id)
                               .where('LOWER(email) = ?', clean_email)
                               .first

        if account
          opp = account.opportunities.order(created_at: :desc).first
          return {
            contact_id: nil,
            account_id: account.id,
            opportunity_id: opp&.id
          }
        end

        # 3. Match by domain if domain is custom (not gmail/hotmail/etc)
        domain = clean_email.split('@').last
        public_providers = %w[gmail.com hotmail.com yahoo.com outlook.com icloud.com uol.com.br bol.com.br terra.com.br]
        if domain.present? && !public_providers.include?(domain)
          account = Sales::Account.where(company_id: company_id)
                                 .where('LOWER(domain) = ? OR LOWER(website) LIKE ?', domain, "%#{domain}%")
                                 .first
          if account
            opp = account.opportunities.order(created_at: :desc).first
            return {
              contact_id: nil,
              account_id: account.id,
              opportunity_id: opp&.id
            }
          end
        end

        {}
      end
    end
  end
end
