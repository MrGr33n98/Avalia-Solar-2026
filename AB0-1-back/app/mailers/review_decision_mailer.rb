class ReviewDecisionMailer < ApplicationMailer
  def decision_notification
    @review = params[:review]
    @user = @review.user
    @new_status = params[:new_status]
    @previous_status = params[:previous_status]
    @notes = params[:notes]
    @admin_name = params[:admin_name]
    @company = @review.company
    @company_url = frontend_url("/companies/#{@company.slug || @company.id}")

    mail(
      to: @user.email,
      subject: email_subject
    )
  end

  private

  def email_subject
    case @new_status.to_s
    when 'approved'
      'Sua avaliação foi aprovada'
    when 'rejected'
      'Sua avaliação foi rejeitada'
    else
      'Atualização na sua avaliação'
    end
  end
end
