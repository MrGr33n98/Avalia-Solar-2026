# frozen_string_literal: true

class CompanyInvitationService
  Result = Struct.new(:success?, :invitation, :error, keyword_init: true)

  def initialize(company:, invited_by:)
    @company = company
    @invited_by = invited_by
  end

  def create(email:, role: 'editor')
    normalized_email = email.to_s.strip.downcase
    role_sym = role.to_s.presence || 'editor'

    unless CompanyInvitation.roles.key?(role_sym)
      return Result.new(success?: false, error: 'Papel inválido')
    end

    existing_user = User.find_by(email: normalized_email)
    if existing_user && @company.company_members.active.exists?(user_id: existing_user.id)
      return Result.new(success?: false, error: 'Usuário já é membro ativo desta empresa')
    end

    @company.company_invitations.where(email: normalized_email, status: 'pending').update_all(status: 'revoked')

    invitation = @company.company_invitations.new(
      invited_by: @invited_by,
      email: normalized_email,
      role: role_sym
    )
    raw_token = invitation.generate_token!

    if invitation.save
      CompanyInvitationMailer.invite_email(invitation.id, raw_token).deliver_later
      Result.new(success?: true, invitation: invitation)
    else
      Result.new(success?: false, error: invitation.errors.full_messages.to_sentence)
    end
  end
end
