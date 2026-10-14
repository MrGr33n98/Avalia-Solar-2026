# frozen_string_literal: true

class CompanyInvitationMailer < ApplicationMailer
  def invite_email(invitation_id, raw_token)
    @invitation = CompanyInvitation.find_by(id: invitation_id)
    return unless @invitation

    @company = @invitation.company
    @invited_by = @invitation.invited_by
    @raw_token = raw_token
    @accept_url = frontend_url("/invite#token=#{raw_token}")

    mail(
      to: @invitation.email,
      subject: "Convite para gerenciar a #{@company.name} no Avalia Solar"
    )
  end
end
