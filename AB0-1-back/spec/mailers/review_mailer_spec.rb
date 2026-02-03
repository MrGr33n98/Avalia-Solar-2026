require 'rails_helper'

RSpec.describe ReviewMailer, type: :mailer do
  let(:user) do
    create(
      :user,
      role: 'review',
      status: :active,
      company: nil,
      city: 'Sao Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }
  let(:review) do
    Review.create!(
      user: user,
      company: company,
      rating: 4,
      comment: 'Comentario suficiente para passar validacao',
      reply: 'Obrigado pelo feedback!',
      replied_at: Time.current
    )
  end

  it 'renders new_reply email' do
    mail = described_class.new_reply(review)

    expect(mail.subject).to eq("Sua avalia\u00e7\u00e3o recebeu uma resposta")
    expect(mail.to).to eq([user.email])
    expect(mail.body.encoded).to include(company.name)
    expect(mail.body.encoded).to include(review.reply)
  end
end
