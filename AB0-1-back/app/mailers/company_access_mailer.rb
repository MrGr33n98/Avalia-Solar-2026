class CompanyAccessMailer < ApplicationMailer
  def access_granted(user, company)
    @user = user
    @company = company
    @dashboard_url = frontend_url("/company-dashboard?company_id=#{company.id}")

    mail(
      to: @user.email,
      subject: 'Acesso liberado para a empresa'
    )
  end

  def access_rejected(user, company, reason)
    @user = user
    @company = company
    @reason = reason.presence || 'Motivo não informado'

    mail(
      to: @user.email,
      subject: 'Solicitação de acesso rejeitada'
    )
  end
end
