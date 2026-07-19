# frozen_string_literal: true

class LeadVerificationMailer < ApplicationMailer
  def verification_code(lead_or_id, otp_code)
    @lead = lead_or_id.is_a?(Lead) ? lead_or_id : Lead.find(lead_or_id)
    @otp_code = otp_code.to_s
    @expires_in_minutes = (Lead::OTP_TTL / 60).to_i

    mail(
      to: @lead.email,
      subject: 'Seu código de verificação - Avalia Solar'
    )
  end
end
