# frozen_string_literal: true

# app/graphql/mutations/create_lead.rb
# Cria um lead (solicitação de orçamento) gravando diretamente no PostgreSQL.
# Mesma regra de negócio do LeadsController#create — não duplica lógica crítica.
module Mutations
  class CreateLead < Mutations::BaseMutation
    description 'Envia uma solicitação de orçamento para uma empresa'

    # Campos de retorno
    field :lead, Types::LeadType, null: true
    field :errors, [String], null: false

    # Campos de entrada
    argument :company_id, ID, required: true
    argument :name, String, required: true
    argument :email, String, required: true
    argument :phone, String, required: true
    argument :message, String, required: false
    argument :city, String, required: false
    argument :state, String, required: false
    argument :service_type, String, required: false
    argument :origin, String, required: false, default_value: 'graphql'
    argument :lgpd_consent, Boolean, required: true

    def resolve(
      company_id:, name:, email:, phone:,
      message: nil, city: nil, state: nil,
      service_type: nil, origin: 'graphql',
      lgpd_consent:
    )
      # Valida consentimento LGPD
      unless lgpd_consent
        return { lead: nil, errors: ['Consentimento LGPD é obrigatório'] }
      end

      # Valida que a empresa existe e está ativa
      company = Company.active.find_by(id: company_id)
      unless company
        return { lead: nil, errors: ['Empresa não encontrada ou inativa'] }
      end

      # Monta o lead com os campos disponíveis
      lead_attrs = {
        name: name,
        email: email.to_s.strip.downcase,
        phone: phone.to_s.gsub(/\D/, ''),
        company_id: company.id
      }

      lead_attrs[:message] = message if Lead.column_names.include?('message')
      lead_attrs[:city] = city if city.present? && Lead.column_names.include?('city')
      lead_attrs[:state] = state if state.present? && Lead.column_names.include?('state')
      lead_attrs[:origin] = origin if Lead.column_names.include?('origin')

      lead = Lead.new(lead_attrs)
      lead[:company] = company.name if Lead.column_names.include?('company')

      if lead.save
        # Tracking analytics (não bloqueia a resposta)
        begin
          Analytics::TrackEventService.call(
            event_type: 'lead_created_graphql',
            company_id: company.id,
            metadata: { origin: origin, graphql: true }
          )
        rescue StandardError => e
          Rails.logger.warn("[GraphQL] Analytics error on lead creation: #{e.message}")
        end

        { lead: lead, errors: [] }
      else
        { lead: nil, errors: lead.errors.full_messages }
      end
    rescue StandardError => e
      if defined?(lead) && lead&.persisted? && e.class.name.include?('Redis')
        Rails.logger.warn("[GraphQL CreateLead] Salvo com sucesso no Postgres, mas falhou ao processar callbacks do Redis: #{e.message}")
        { lead: lead, errors: [] }
      else
        Rails.logger.error("[GraphQL CreateLead] #{e.class}: #{e.message}")
        { lead: nil, errors: ['Erro interno ao criar solicitação'] }
      end
    end
  end
end
