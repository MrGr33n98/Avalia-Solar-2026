# frozen_string_literal: true

module Sales
  module Messaging
    class VariableResolver
      def self.resolve(text, context = {})
        return '' if text.blank?

        resolved = text.dup
        person = context[:person] || context[:contact]
        company = context[:company] || context[:account]
        opportunity = context[:opportunity] || context[:lead]
        owner = context[:owner] || context[:user]

        # person.* / contact.*
        if person.present?
          resolved.gsub!('{{person.first_name}}', person.try(:first_name).to_s)
          resolved.gsub!('{{person.last_name}}', person.try(:last_name).to_s)
          resolved.gsub!('{{person.name}}', [person.try(:first_name), person.try(:last_name)].compact.join(' '))
          resolved.gsub!('{{person.email}}', person.try(:email).to_s)
          resolved.gsub!('{{person.job_title}}', person.try(:job_title).to_s)
        end

        # company.* / account.*
        if company.present?
          resolved.gsub!('{{company.name}}', company.try(:name).to_s)
          resolved.gsub!('{{company.domain}}', company.try(:domain).to_s)
          resolved.gsub!('{{company.city}}', company.try(:city).to_s)
          resolved.gsub!('{{company.state}}', company.try(:state).to_s)
        end

        # lead.* / opportunity.*
        if opportunity.present?
          resolved.gsub!('{{lead.title}}', opportunity.try(:name).to_s)
          resolved.gsub!('{{lead.name}}', opportunity.try(:name).to_s)
          resolved.gsub!('{{lead.value}}', opportunity.try(:value_cents) ? "R$ #{'%.2f' % (opportunity.value_cents / 100.0)}" : 'R$ 0,00')
        end

        # owner.* / user.*
        if owner.present?
          resolved.gsub!('{{owner.name}}', owner.try(:name).to_s)
          resolved.gsub!('{{owner.email}}', owner.try(:email).to_s)
        end

        # Fallback for remaining unresolved mustache tags
        resolved.gsub(/\{\{[a-zA-Z0-9_.]+\}\}/, '')
      end
    end
  end
end
