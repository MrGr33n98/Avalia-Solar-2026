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

        scope = ::Lead.where(company_id: @company.id)

        # 1. Match by email
        if @dto.email.present?
          matched = scope.find_by('LOWER(email) = ?', @dto.email.downcase)
          return { duplicate_type: 'email', record: matched } if matched.present?
        end

        # 2. Match by phone or whatsapp
        phone_to_check = @dto.phone || @dto.whatsapp
        if phone_to_check.present?
          clean_phone = phone_to_check.gsub(/\D/, '')
          if clean_phone.length >= 8
            matched = scope.find_by("regexp_replace(phone, '\\D', '', 'g') = ?", clean_phone)
            return { duplicate_type: 'phone', record: matched } if matched.present?
          end
        end

        # 3. Match by name & company
        if @dto.contact_name.present? && @dto.company_name.present?
          matched = scope.find_by('LOWER(name) = ? AND LOWER(company) = ?', @dto.contact_name.downcase, @dto.company_name.downcase)
          return { duplicate_type: 'company_and_contact', record: matched } if matched.present?
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
