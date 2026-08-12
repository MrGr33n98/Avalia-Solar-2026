# frozen_string_literal: true

class CompanyFieldPolicy
  FIELD_GROUPS = {
    description: %w[description],
    business_hours: %w[working_hours],
    contact: %w[website phone phone_alt whatsapp email_public instagram facebook linkedin],
    identity: %w[name],
    legal_identity: %w[cnpj],
    location: %w[address city state],
    media: %w[logo banner],
    categories: %w[categories],
    service_area: %w[coverage_states coverage_cities coverage_state_codes coverage_city_names]
  }.freeze

  def initialize(company)
    @company = company
  end

  def decision(field, exceeds_limit: false)
    group = FIELD_GROUPS.key?(field.to_sym) ? field.to_sym : group_for(field)
    return fail_safe(field, 'UNKNOWN_FIELD') unless group

    case group
    when :legal_identity
      result(group, editable: true, direct_update: false, requires_approval: true,
             requires_verification: true, reason_code: 'VERIFICATION_REQUIRED', field: field.to_s)
    when :location
      result(group, editable: true, direct_update: false, requires_approval: true,
             requires_verification: false, reason_code: 'LOCATION_REVIEW_REQUIRED', field: field.to_s)
    when :media
      media_decision(field)
    when :categories, :service_area
      limit_decision(group, field, exceeds_limit)
    else
      result(group, editable: true, direct_update: true, requires_approval: false,
             requires_verification: false, reason_code: 'DIRECT_UPDATE', field: field.to_s)
    end
  end

  private

  attr_reader :company

  def group_for(field)
    FIELD_GROUPS.find { |_group, fields| fields.include?(field.to_s) }&.first
  end

  def media_decision(field)
    access = company.feature_access['profile_media_direct_update'] rescue nil
    enabled = if access
                access['state'] == 'enabled'
              else
                company.inferred_plan_tier.to_s == 'enterprise'
              end
    result(:media, editable: true, direct_update: enabled, requires_approval: !enabled,
           requires_verification: false,
           reason_code: enabled ? 'ENTITLEMENT_GRANTED' : 'APPROVAL_REQUIRED', field: field.to_s)
  end

  def limit_decision(group, field, exceeds_limit)
    enabled = !exceeds_limit
    result(group, editable: true, direct_update: enabled, requires_approval: !enabled,
           requires_verification: false,
           reason_code: enabled ? 'DIRECT_UPDATE' : 'LIMIT_EXCEEDED', field: field.to_s)
  end

  def fail_safe(field, reason_code)
    result(nil, editable: false, direct_update: false, requires_approval: true,
           requires_verification: true, reason_code: reason_code, field: field.to_s)
  end

  def result(group, **values)
    { field_group: group&.to_s, visibility: 'PUBLIC', **values }
  end
end
