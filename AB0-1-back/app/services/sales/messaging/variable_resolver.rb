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
          first_name = get_val(person, :first_name)
          last_name = get_val(person, :last_name)
          full_name = get_val(person, :full_name) || get_val(person, :name) || [first_name, last_name].compact.reject(&:blank?).join(' ')
          email = get_val(person, :email)
          job_title = get_val(person, :job_title)

          resolved.gsub!('{{person.first_name}}', first_name.to_s)
          resolved.gsub!('{{person.last_name}}', last_name.to_s)
          resolved.gsub!('{{person.name}}', full_name.to_s)
          resolved.gsub!('{{person.full_name}}', full_name.to_s)
          resolved.gsub!('{{person.email}}', email.to_s)
          resolved.gsub!('{{person.job_title}}', job_title.to_s)

          resolved.gsub!('{{contact.first_name}}', first_name.to_s)
          resolved.gsub!('{{contact.last_name}}', last_name.to_s)
          resolved.gsub!('{{contact.name}}', full_name.to_s)
          resolved.gsub!('{{contact.email}}', email.to_s)
        end

        # company.* / account.*
        if company.present?
          name = get_val(company, :name)
          domain = get_val(company, :domain) || get_val(company, :website)
          city = get_val(company, :city)
          state = get_val(company, :state)
          website = get_val(company, :website) || domain

          resolved.gsub!('{{company.name}}', name.to_s)
          resolved.gsub!('{{company.domain}}', domain.to_s)
          resolved.gsub!('{{company.website}}', website.to_s)
          resolved.gsub!('{{company.city}}', city.to_s)
          resolved.gsub!('{{company.state}}', state.to_s)

          resolved.gsub!('{{account.name}}', name.to_s)
          resolved.gsub!('{{account.city}}', city.to_s)
          resolved.gsub!('{{account.state}}', state.to_s)
        end

        # lead.* / opportunity.*
        if opportunity.present?
          title = get_val(opportunity, :title) || get_val(opportunity, :name)
          val_cents = get_val(opportunity, :value_cents)
          val_str = get_val(opportunity, :value) || (val_cents ? "R$ #{'%.2f' % (val_cents / 100.0)}" : 'R$ 0,00')

          resolved.gsub!('{{lead.title}}', title.to_s)
          resolved.gsub!('{{lead.name}}', title.to_s)
          resolved.gsub!('{{lead.value}}', val_str.to_s)
          resolved.gsub!('{{opportunity.title}}', title.to_s)
          resolved.gsub!('{{opportunity.value}}', val_str.to_s)
        end

        # owner.* / user.*
        if owner.present?
          name = get_val(owner, :full_name) || get_val(owner, :name) || get_val(owner, :first_name)
          first_name = get_val(owner, :first_name)
          email = get_val(owner, :email)

          resolved.gsub!('{{owner.name}}', name.to_s)
          resolved.gsub!('{{owner.first_name}}', first_name.to_s)
          resolved.gsub!('{{owner.email}}', email.to_s)
          resolved.gsub!('{{user.name}}', name.to_s)
          resolved.gsub!('{{user.email}}', email.to_s)
        end

        # Fallback for remaining unresolved mustache tags
        resolved.gsub(/\{\{[a-zA-Z0-9_.]+\}\}/, '')
      end

      def self.get_val(obj, key)
        return nil if obj.nil?

        if obj.is_a?(Hash)
          obj[key.to_sym] || obj[key.to_s]
        elsif obj.respond_to?(key.to_sym)
          obj.public_send(key.to_sym)
        end
      end
    end
  end
end
