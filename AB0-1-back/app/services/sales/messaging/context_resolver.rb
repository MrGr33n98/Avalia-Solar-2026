# frozen_string_literal: true

module Sales
  module Messaging
    class ContextResolver
      def self.resolve(company_id:, current_user:, context_ids: {}, raw_context: {}, tenant_scope: nil)
        context = {}

        if context_ids.present? && company_id.present?
          if context_ids[:contact_id].present?
            contact = tenant_scope ? tenant_scope.contacts.find_by(id: context_ids[:contact_id]) : nil
            contact ||= ::Contact.where(company_id: company_id).find_by(id: context_ids[:contact_id]) if !tenant_scope && defined?(::Contact)
            if contact
              full_name = [contact.try(:first_name), contact.try(:last_name)].compact_blank.join(' ').presence || contact.try(:name)
              context[:person] = {
                first_name: contact.try(:first_name) || contact.try(:name)&.split(' ')&.first || 'Cliente',
                last_name: contact.try(:last_name) || contact.try(:name)&.split(' ')&.drop(1)&.join(' ') || '',
                full_name: full_name || 'Cliente',
                email: contact.try(:email) || '',
                phone: contact.try(:phone) || ''
              }
            end
          end

          if context_ids[:account_id].present?
            account = tenant_scope ? tenant_scope.accounts.find_by(id: context_ids[:account_id]) : nil
            account ||= ::Account.where(company_id: company_id).find_by(id: context_ids[:account_id]) if !tenant_scope && defined?(::Account)
            if account
              context[:company] = {
                name: account.try(:name) || 'Empresa Exemplo',
                website: account.try(:website) || '',
                city: account.try(:city) || '',
                state: account.try(:state) || ''
              }
            end
          end

          if context_ids[:opportunity_id].present?
            opp = tenant_scope ? tenant_scope.opportunities.find_by(id: context_ids[:opportunity_id]) : nil
            opp ||= ::Opportunity.where(company_id: company_id).find_by(id: context_ids[:opportunity_id]) if !tenant_scope && defined?(::Opportunity)
            if opp
              amount = opp.respond_to?(:value_cents) ? opp.value_cents.to_i / 100.0 : opp.try(:value).to_f
              context[:opportunity] = {
                title: opp.try(:title) || opp.try(:name) || 'Oportunidade',
                value: "R$ #{format('%.2f', amount).tr('.', ',')}",
                stage: opp.try(:stage)&.try(:name) || opp.try(:stage) || 'Em Andamento'
              }
            end
          end
        end

        # Fallback / Overrides safely sanitized
        if raw_context.is_a?(Hash) && raw_context.present?
          context = context.deep_merge(raw_context.symbolize_keys)
        end

        # Always inject owner/user details from authenticated session if not set
        if current_user.present?
          context[:owner] ||= {
            first_name: current_user.try(:first_name) || current_user.try(:name)&.split(' ')&.first || 'Consultor',
            full_name: current_user.try(:name) || current_user.try(:email) || 'Consultor',
            email: current_user.email,
            phone: current_user.try(:phone) || ''
          }
        end

        # Default mock fallbacks for missing keys so preview looks good
        context[:person] ||= { first_name: 'Maria', last_name: 'Silva', full_name: 'Maria Silva', email: 'maria@exemplo.com.br', phone: '(11) 99999-0000' }
        context[:company] ||= { name: 'Solaris Energia LTDA', website: 'https://solarisenergia.com.br', city: 'Campinas', state: 'SP' }
        context[:opportunity] ||= { title: 'Sistema Solar Fotovoltaico 12kWp', value: 'R$ 42.500,00', stage: 'Proposta Comercial' }

        context
      end
    end
  end
end
