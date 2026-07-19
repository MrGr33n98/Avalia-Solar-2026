class ReviewMailer < ApplicationMailer
  def new_reply(review)
    @review = review
    @user = review.user
    @company = review.company
    @reply = review.reply
    @review_url = frontend_url("/companies/#{@company.slug || @company.id}")

    mail(
      to: @user.email,
      subject: 'Sua avaliação recebeu uma resposta'
    )
  end
end
