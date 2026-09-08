# frozen_string_literal: true

module Sales
  module Imports
    class LeadDuplicateDetector
      def self.call(dto, company:)
        new(dto, company: company).detect
      end

      def initialize(dto, company:)
        @dto = dto
        @company = company
      end

      def detect
        return nil if @company.nil?

        # 1. Match by email in Sales::Contact
        if @dto.email.present?
          cnt = ::Sales::Contact.joins(:account)
                                .where('sales_accounts.company_id = ? OR sales_contacts.user_id IN (?)', @company.id, @company.users.select(:id))
                                .find_by('LOWER(sales_contacts.email) = ?', @dto.email.downcase)
          if cnt.present?
            opp = cnt.account.opportunities.first
            return { duplicate_type: 'email', record: opp || cnt.account }
          end

          if defined?(::Lead)
            matched = ::Lead.where(company_id: @company.id).find_by('LOWER(email) = ?', @dto.email.downcase) rescue nil
            return { duplicate_type: 'email', record: matched } if matched.present?
          end
        end

        # 2. Match by phone / whatsapp
        phone_to_check = @dto.phone || @dto.whatsapp
        if phone_to_check.present?
          clean_phone = phone_to_check.gsub(/\D/, '')
          if clean_phone.length >= 8
            cnt = ::Sales::Contact.joins(:account)
                                  .where('sales_accounts.company_id = ? OR sales_contacts.user_id IN (?)', @company.id, @company.users.select(:id))
                                  .find_by("regexp_replace(sales_contacts.phone, '\\D', '', 'g') = ? OR regexp_replace(sales_contacts.whatsapp, '\\D', '', 'g') = ?", clean_phone, clean_phone)
            if cnt.present?
              opp = cnt.account.opportunities.first
              return { duplicate_type: 'phone', record: opp || cnt.account }
            end

            if defined?(::Lead)
              matched = ::Lead.where(company_id: @company.id).find_by("regexp_replace(phone, '\\D', '', 'g') = ?", clean_phone) rescue nil
              return { duplicate_type: 'phone', record: matched } if matched.present?
            end
          end
        end

        # 3. Match by Account company name
        if @dto.company_name.present?
          acc = ::Sales::Account.where('company_id = ? OR owner_id IN (?)', @company.id, @company.users.select(:id))
                                .find_by('LOWER(name) = ?', @dto.company_name.downcase)
          if acc.present?
            opp = acc.opportunities.first
            return { duplicate_type: 'company_name', record: opp || acc }
          end
        end

        nil
      end

      def self.calculate_fingerprint(company_id, dto)
        components = [
          company_id.to_s,
          dto.email.to_s.downcase.strip,
          dto.phone.to_s.gsub(/\D/, ''),
          dto.company_name.to_s.downcase.strip
        ]
        Digest::SHA256.hexdigest(components.join('|'))
      end
    end
  end
end
