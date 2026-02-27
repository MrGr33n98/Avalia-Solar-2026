# frozen_string_literal: true

module LeadWizard
  class Creator
    attr_reader :lead, :errors

    def initialize(params, preferred_company_id: nil, edge_location: nil, remote_ip: nil)
      @params = params
      @preferred_company_id = preferred_company_id
      @edge_location = edge_location
      @remote_ip = remote_ip
      @errors = {}
    end

    def call
      @lead = build_lead
      
      if validate_and_save
        { success: true, lead: @lead }
      else
        { success: false, errors: @lead.errors.messages.merge(@errors) }
      end
    rescue StandardError => e
      Rails.logger.error("[LeadWizard::Creator] Unexpected Error: #{e.message}
#{e.backtrace.first(10).join("
")}")
      { success: false, error: 'internal_error', message: e.message }
    end

    private

    def build_lead
      core_params = @params[:lead] || {}
      wizard_answers = @params[:wizard_answers] || {}

      # Normalization logic for legacy payloads
      if wizard_answers.blank?
        wizard_answers = core_params.except(
          :full_name, :email, :phone, :zipcode, :city, :state, :consent, 
          :preferred_company_id, :category_id, :utm, :attribution
        )
      end

      category_id = core_params[:category_id] || @params[:category_id]
      
      lead = ::Lead.new(
        name: core_params[:full_name] || core_params[:name],
        email: core_params[:email],
        phone: core_params[:phone],
        zipcode: core_params[:zipcode],
        city: core_params[:city] || @edge_location&.dig(:city),
        state: core_params[:state] || @edge_location&.dig(:state),
        category_id: category_id,
        company_id: @preferred_company_id || core_params[:preferred_company_id],
        wizard_status: 'pending_otp',
        wizard_answers: wizard_answers
      )

      lead.consent_at = Time.current if truthy?(core_params[:consent])
      lead.consent_ip = @remote_ip if lead.consent_at.present?

      # Resolve and assign template info
      schema_info = LeadWizard::Resolver.resolve(category_id: category_id)
      lead.template_key = schema_info[:template_key]
      lead.template_version = schema_info[:template_version]

      apply_metadata(lead, core_params)
      
      lead
    end

    def validate_and_save
      # 1. Base validations
      return false unless @lead.valid?

      # 2. Dynamic schema validation
      schema_info = LeadWizard::Resolver.resolve(category_id: @lead.category_id)
      validate_answers(@lead.wizard_answers, schema_info[:schema])

      return false if @errors.any?

      @lead.save
    end

    def validate_answers(answers, schema)
      return if schema.blank? || schema[:steps].blank?

      schema[:steps].each do |step|
        step[:fields].each do |field|
          key = field[:key].to_s
          value = answers[key] || answers[key.to_sym]

          if field[:required] && value.blank?
            @errors[key] = ["is required"]
          end

          # Add more validation (types, options) if needed
        end
      end
    end

    def apply_metadata(lead, core_params)
      # UTM logic simplified for brevity - assumes helper existence or duplication
      utm = @params[:utm] || core_params[:utm] || {}
      attribution = @params[:attribution] || core_params[:attribution] || {}
      
      # Assign if columns exist
      lead.utm_source = utm[:utm_source] if lead.respond_to?(:utm_source=)
      lead.utm_medium = utm[:utm_medium] if lead.respond_to?(:utm_medium=)
      lead.utm_campaign = utm[:utm_campaign] if lead.respond_to?(:utm_campaign=)
      # ... and so on
    end

    def truthy?(value)
      %w[true 1 yes sim].include?(value.to_s.downcase)
    end
  end
end
