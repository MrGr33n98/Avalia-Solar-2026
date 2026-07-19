# frozen_string_literal: true

class AvaliaSolarMailerPreview < ActionMailer::Preview
  def confirmation
    UserMailer.email_confirmation(user, 'preview-confirmation-token')
  end

  def reset_password
    UserMailer.reset_password_instructions(user, 'preview-reset-token')
  end

  def welcome
    UserMailer.welcome(user)
  end

  def verification_code
    LeadVerificationMailer.verification_code(lead, '123456')
  end

  def access_granted
    CompanyAccessMailer.access_granted(user, company)
  end

  def access_rejected
    CompanyAccessMailer.access_rejected(user, company, 'Os dados enviados precisam ser revisados.')
  end

  def notification
    NotificationMailer.system_notification(user, 'review_helpful', 'Sua avaliação ajudou outro consumidor.')
  end

  def new_review
    CompanyMailer.new_review(company, review)
  end

  def review_reply
    ReviewMailer.new_reply(review)
  end

  def review_approved
    ReviewDecisionMailer.with(
      review: review,
      new_status: 'approved',
      previous_status: 'pending',
      notes: 'Conteúdo aprovado após análise.',
      admin_name: 'Equipe de moderação'
    ).decision_notification
  end

  private

  def user
    @user ||= User.new(
      id: 9001, name: 'Marina Silva', email: 'marina.preview@example.com',
      role: 'review', status: 'active'
    )
  end

  def company
    @company ||= Company.new(
      id: 9002, name: 'Solar Exemplo',
      email: 'empresa.preview@example.com', slug: 'solar-exemplo'
    )
  end

  def review
    @review ||= Review.new(
      id: 9003,
      user: user,
      company: company,
      rating: 4,
      comment: 'Atendimento claro e instalação bem executada.',
      reply: 'Obrigado por compartilhar sua experiência.'
    )
  end

  def lead
    @lead ||= Lead.new(id: 9004, email: 'lead.preview@example.com')
  end
end
