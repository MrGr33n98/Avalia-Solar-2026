# frozen_string_literal: true

module CorporateDomainEnforcement
  private

  def corporate_domain_validator
    @corporate_domain_validator ||= CorporateDomain::Validator.new
  end

  def enforce_corporate_domain_for_email!(email:, operation:)
    return true if corporate_domain_validator.valid_email?(email)

    render_error_response(
      message: corporate_domain_validator.invalid_message,
      status: :forbidden,
      code: 'CORPORATE_DOMAIN_NOT_ALLOWED',
      details: {
        operation: operation,
        allowed_domains: corporate_domain_validator.allowed_domains
      }
    )
    false
  end

  def enforce_corporate_domain_for_user!(user:, operation:)
    return false if user.blank?

    enforce_corporate_domain_for_email!(
      email: user.email,
      operation: operation
    )
  end
end
