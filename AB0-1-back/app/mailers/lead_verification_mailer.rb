# frozen_string_literal: true

class LeadVerificationMailer < ApplicationMailer
  def verification_code(lead_id, otp_code)
    @lead = Lead.find(lead_id)
    @otp_code = otp_code.to_s
    @expires_in_minutes = (Lead::OTP_TTL / 60).to_i

    mail(
      to: @lead.email,
      subject: 'Seu codigo de verificacao - Avalia Solar'
    )
  end
end
