# frozen_string_literal: true

module LeadWizard
  class Creator
    UTM_FIELD_KEYS = %w[
      utm_source
      utm_medium
      utm_campaign
      utm_content
      utm_term
      gclid
      fbclid
      msclkid
      landing_path
      referrer_host
    ].freeze
    DECISION_CONTEXT_KEYS = %w[source view_mode result_position approximate_location filter_context].freeze
    IDENTITY_FIELD_KEYS = %w[anonymous_id session_id].freeze
    SCHEMA_FIELD_ALIASES = {
      'full_name' => %w[fullName name],
      'zipcode' => %w[zipCode],
      'project_profile' => %w[projectProfile],
      'system_size_band' => %w[systemSizeBand systemSizeChoice],
      'decision_timeline' => %w[decisionTimeline]
    }.freeze
    LEGACY_OPTION_VALUES = {
      'project_profile' => {
        'Residencial' => 'residential', 'Comercial' => 'commercial',
        'Industrial' => 'industrial', 'Rural' => 'rural'
      },
      'system_size_band' => {
        'Ate 7 kWp' => 'up_to_7_kwp', 'Até 7 kWp' => 'up_to_7_kwp',
        '8 kWp ou mais' => '8_kwp_plus', 'Não sei' => 'dont_know'
      },
      'decision_timeline' => {
        'Agora' => 'immediate', 'Imediato' => 'immediate',
        'Em ate 6 meses' => '6_months', 'Em até 6 meses' => '6_months',
        'Mais de 6 meses' => 'researching'
      }
    }.freeze

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
      Rails.logger.error(
        "[LeadWizard::Creator] Unexpected Error: #{e.message}\n#{e.backtrace.first(10).join("\n")}"
      )
      { success: false, error: 'internal_error', message: e.message }
    end

    private

    def build_lead
      core_params = normalize_hash(@params['lead'])
      @core_params = core_params
      wizard_answers = normalize_hash(@params['wizard_answers'])

      # Normalization logic for legacy payloads
      if wizard_answers.blank?
        wizard_answers = core_params.except(*CORE_WIZARD_KEYS)
      end
      merge_identity_into_wizard_answers!(wizard_answers, core_params)

      category_id = value_for(core_params, 'category_id', 'categoryId') || @params['category_id']
      company_id = @preferred_company_id || value_for(core_params, 'preferred_company_id', 'preferredCompanyId')

      if category_id.blank?
        resolved_vertical = value_for(core_params, 'product_vertical', 'productVertical')
        if resolved_vertical.present?
          normalized_vertical = resolved_vertical.downcase
          cat = Category.where(
            "LOWER(name) = :value OR LOWER(seo_url) = :value OR :value LIKE CONCAT('%', LOWER(name), '%')",
            value: normalized_vertical
          ).first
          category_id = cat&.id
        end
      end

      if category_id.blank? && company_id.present?
        preferred_company = Company.find_by(id: company_id)
        category_id = preferred_company&.categories&.first&.id
      end

      schema_info = resolve_schema_info(category_id: category_id, preferred_company_id: company_id)
      company_available = schema_info.dig(:availability, :company_available) != false
      category = Category.find_by(id: category_id)

      if company_id.present? && !company_available
        @errors['preferred_company_id'] = [schema_info.dig(:availability, :message) || 'is not available for this category']
      end

      if company_id.present? && company_available
        preferred_company = Company.find_by(id: company_id)
        unless preferred_company&.has_paid_plan?
          @errors['preferred_company_id'] = ['não possui entitlement de conversão pago']
        end
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
      lead.lead_wizard_version = schema_info[:wizard_version] if schema_info[:wizard_version] && lead.respond_to?(:lead_wizard_version=)
      lead.source = source_value if lead.respond_to?(:source=)

      apply_metadata(lead, core_params)

      lead
    end

    def validate_and_save
      # 1. Base validations
      return false unless @lead.valid?
      return false if @errors.any?

      # 2. Dynamic schema validation
      schema_info = @schema_info || resolve_schema_info(category_id: @lead.category_id, preferred_company_id: @lead.company_id)
      validate_answers(@lead.wizard_answers, schema_info[:schema], @core_params || {})

      return false if @errors.any?

      @lead.save
    end

    def validate_answers(answers, schema, core_params = {})
      return if schema.blank? || schema[:steps].blank?

      schema[:steps].each do |step|
        step[:fields].each do |field|
          key = field[:key].to_s
          value = field_value_for_schema_field(answers, core_params, key)
          required = truthy?(field[:required])

          if required && value.blank?
            @errors[key] = ["is required"]
            next
          end

          validate_field_options(key, value, field)
          validate_field_range(key, value, field)
        end
      end
    end

    def field_value_for_schema_field(answers, core_params, key)
      keys = [key, *SCHEMA_FIELD_ALIASES.fetch(key, [])]
      value = keys.lazy.filter_map do |candidate|
        answers[candidate] || answers[candidate.to_sym] ||
          core_params[candidate] || core_params[candidate.to_sym]
      end.find(&:present?)
      return value if value.present?
      return value_for(core_params, 'address_full', 'addressFull') if key == 'zipcode'

      nil
    end

    def validate_field_options(key, value, field)
      options = Array(field[:options])
      return if options.blank? || value.blank?

      allowed_values = options.map { |option| option[:value].to_s }
      normalized_value = LEGACY_OPTION_VALUES.fetch(key, {}).fetch(value.to_s, value.to_s)
      return if allowed_values.include?(normalized_value)

      @errors[key] ||= []
      @errors[key] << 'is not a valid option'
    end

    def validate_field_range(key, value, field)
      numeric_value = Float(value)
      min = field[:min]
      max = field[:max]
      return if min.blank? && max.blank?

      if min.present? && numeric_value < min.to_f
        @errors[key] ||= []
        @errors[key] << "must be greater than or equal to #{min}"
      end

      if max.present? && numeric_value > max.to_f
        @errors[key] ||= []
        @errors[key] << "must be less than or equal to #{max}"
      end
    rescue ArgumentError, TypeError
      nil
    end

    def apply_metadata(lead, core_params)
      top_level_utm = normalize_hash(@params.slice(*UTM_FIELD_KEYS))
      core_level_utm = normalize_hash(core_params.slice(*UTM_FIELD_KEYS))
      nested_utm = normalize_hash(@params['utm']).presence || normalize_hash(core_params['utm']).presence
      utm = nested_utm || top_level_utm.presence || core_level_utm.presence || {}

      attribution =
        normalize_hash(@params['attribution']).presence ||
        normalize_hash(core_params['attribution']).presence ||
        normalize_hash(@params['attribution_json']).presence ||
        normalize_hash(core_params['attribution_json']).presence
      attribution ||= {}

      identity_fields = extract_identity_fields(core_params)
      attribution.merge!(identity_fields) if identity_fields.present?
      raw_context = normalize_hash(@params['decision_context']).slice(*DECISION_CONTEXT_KEYS)
      decision_context = sanitize_decision_context(raw_context)
      decision_context['company_id'] = lead.company_id if lead.company_id.present?
      decision_context['category_id'] = lead.category_id if lead.category_id.present?
      attribution['decision_context'] = decision_context if decision_context.present?

      assign_if_present(lead, :utm_source, utm['utm_source'])
      assign_if_present(lead, :utm_medium, utm['utm_medium'])
      assign_if_present(lead, :utm_campaign, utm['utm_campaign'])
      assign_if_present(lead, :utm_content, utm['utm_content'])
      assign_if_present(lead, :utm_term, utm['utm_term'])
      assign_if_present(lead, :gclid, utm['gclid'])
      assign_if_present(lead, :fbclid, utm['fbclid'])
      assign_if_present(lead, :msclkid, utm['msclkid'])
      assign_if_present(lead, :landing_path, utm['landing_path'])
      assign_if_present(lead, :referrer_host, utm['referrer_host'])
      assign_if_present(lead, :attribution_json, attribution) if attribution.present?
    end

    def source_value
      source = value_for(@params, 'source') || value_for(@core_params || {}, 'source')
      source.to_s.strip.presence || 'organic'
    end

    def sanitize_decision_context(context)
      allowed_sources = %w[companies_list company_profile category_page compare map search creator chat banner organic sponsored direct]
      allowed_views = %w[list map compare profile]
      context = context.deep_dup
      context['source'] = context['source'].to_s if context['source'].present?
      context['source'] = 'organic' unless allowed_sources.include?(context['source'])
      context['view_mode'] = context['view_mode'].to_s if context['view_mode'].present?
      context.delete('view_mode') unless allowed_views.include?(context['view_mode'])
      context['result_position'] = context['result_position'].to_i if context['result_position'].present?
      context['result_position'] = context['result_position'].clamp(1, 10_000) if context['result_position'].is_a?(Integer)
      context['approximate_location'] = context['approximate_location'].to_s.first(100) if context['approximate_location'].present?
      context['filter_context'] = normalize_hash(context['filter_context']).slice('category_id', 'state', 'city', 'sort') if context['filter_context'].present?
      context.compact
    end

    def merge_identity_into_wizard_answers!(wizard_answers, core_params)
      identity_fields = extract_identity_fields(core_params)
      return if identity_fields.blank?

      identity_fields.each do |key, value|
        wizard_answers[key] = value if wizard_answers[key].blank?
      end
    end

    def extract_identity_fields(core_params)
      identity = {}
      IDENTITY_FIELD_KEYS.each do |key|
        value = value_for(@params, key) || value_for(core_params, key)
        next if value.blank?

        identity[key] = value.to_s.strip[0, 255]
      end
      identity
    end

    def assign_if_present(record, field, value)
      writer = "#{field}="
      return unless value.present?
      return unless record.respond_to?(writer)

      record.public_send(writer, value)
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
