# frozen_string_literal: true

module LeadWizard
  class Creator
    CORE_WIZARD_KEYS = %w[
      full_name fullName name
      email
      phone
      zipcode zipCode
      city
      state
      consent
      nickname
      preferred_company_id preferredCompanyId
      category_id categoryId
      product_vertical productVertical
      project_profile projectProfile
      quote_type quoteType
      system_size_band systemSizeBand systemSizeChoice
      bill_value billValue
      monthly_kwh monthlyKwh
      decision_timeline decisionTimeline
      address_full addressFull
      utm
      attribution
    ].freeze

    attr_reader :lead, :errors

    def initialize(params, preferred_company_id: nil, edge_location: nil, remote_ip: nil)
      @params = normalize_hash(params)
      @preferred_company_id = preferred_company_id
      @edge_location = edge_location
      @remote_ip = remote_ip
      @errors = {}
      @schema_info = nil
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
      core_params = normalize_hash(@params['lead'])
      wizard_answers = normalize_hash(@params['wizard_answers'])

      # Normalization logic for legacy payloads
      if wizard_answers.blank?
        wizard_answers = core_params.except(*CORE_WIZARD_KEYS)
      end

      category_id = value_for(core_params, 'category_id', 'categoryId') || @params['category_id']
      company_id = @preferred_company_id || value_for(core_params, 'preferred_company_id', 'preferredCompanyId')
      schema_info = resolve_schema_info(category_id: category_id, preferred_company_id: company_id)
      company_available = schema_info.dig(:availability, :company_available) != false
      category = Category.find_by(id: category_id)

      if company_id.present? && !company_available
        @errors['preferred_company_id'] = [schema_info.dig(:availability, :message) || 'is not available for this category']
      end

      resolved_vertical = value_for(core_params, 'product_vertical', 'productVertical') || infer_product_vertical(category)
      resolved_quote_type = value_for(core_params, 'quote_type', 'quoteType') || resolved_vertical
      resolved_address = value_for(core_params, 'address_full', 'addressFull') || fallback_address_full(core_params)

      lead = ::Lead.new(
        name: value_for(core_params, 'full_name', 'fullName', 'name'),
        email: value_for(core_params, 'email'),
        phone: value_for(core_params, 'phone'),
        zipcode: value_for(core_params, 'zipcode', 'zipCode'),
        city: value_for(core_params, 'city') || @edge_location&.dig(:city),
        state: value_for(core_params, 'state') || @edge_location&.dig(:state),
        category_id: category_id,
        company_id: (company_available ? company_id : nil),
        product_vertical: resolved_vertical,
        project_profile: value_for(core_params, 'project_profile', 'projectProfile'),
        quote_type: resolved_quote_type,
        system_size_band: value_for(core_params, 'system_size_band', 'systemSizeBand', 'systemSizeChoice'),
        bill_value: value_for(core_params, 'bill_value', 'billValue'),
        monthly_kwh: value_for(core_params, 'monthly_kwh', 'monthlyKwh'),
        decision_timeline: value_for(core_params, 'decision_timeline', 'decisionTimeline'),
        address_full: resolved_address,
        wizard_status: 'pending_otp',
        wizard_answers: wizard_answers
      )

      lead.consent_at = Time.current if truthy?(value_for(core_params, 'consent'))
      lead.consent_ip = @remote_ip if lead.consent_at.present?

      # Resolve and assign template info
      lead.template_key = schema_info[:template_key]
      lead.template_version = schema_info[:template_version]

      apply_metadata(lead, core_params)
      
      lead
    end

    def validate_and_save
      # 1. Base validations
      return false unless @lead.valid?
      return false if @errors.any?

      # 2. Dynamic schema validation
      schema_info = @schema_info || resolve_schema_info(category_id: @lead.category_id, preferred_company_id: @lead.company_id)
      validate_answers(@lead.wizard_answers, schema_info[:schema])

      return false if @errors.any?

      @lead.save
    end

    def validate_answers(answers, schema)
      return if schema.blank? || schema[:steps].blank?

      schema[:steps].each do |step|
        step[:fields].each do |field|
          next if field[:target].to_s == 'lead'

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
      utm = normalize_hash(@params['utm']).presence || normalize_hash(core_params['utm'])
      attribution = normalize_hash(@params['attribution']).presence || normalize_hash(core_params['attribution'])
      
      # Assign if columns exist
      lead.utm_source = utm['utm_source'] if lead.respond_to?(:utm_source=)
      lead.utm_medium = utm['utm_medium'] if lead.respond_to?(:utm_medium=)
      lead.utm_campaign = utm['utm_campaign'] if lead.respond_to?(:utm_campaign=)
      lead.attribution_json = attribution if lead.respond_to?(:attribution_json=) && attribution.present?
      # ... and so on
    end

    def resolve_schema_info(category_id:, preferred_company_id:)
      @schema_info ||= LeadWizard::Resolver.resolve(
        category_id: category_id,
        preferred_company_id: preferred_company_id
      )
    end

    def infer_product_vertical(category)
      return nil if category.nil?

      category.respond_to?(:seo_url) ? category.seo_url.presence || category.name : category.name
    end

    def fallback_address_full(core_params)
      zipcode = value_for(core_params, 'zipcode', 'zipCode').to_s.strip
      return if zipcode.blank?

      "CEP: #{zipcode}"
    end

    def truthy?(value)
      %w[true 1 yes sim].include?(value.to_s.downcase)
    end

    def normalize_hash(value)
      return {} unless value.is_a?(Hash) || value.respond_to?(:to_unsafe_h)

      raw =
        if value.respond_to?(:to_unsafe_h)
          value.to_unsafe_h
        else
          value.to_h
        end

      raw.deep_stringify_keys
    end

    def value_for(hash, *keys)
      keys.each do |key|
        value = hash[key.to_s]
        return value unless value.nil?
      end
      nil
    end
  end
end
