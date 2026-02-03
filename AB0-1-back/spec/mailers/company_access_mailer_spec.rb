require 'rails_helper'

RSpec.describe CompanyAccessMailer, type: :mailer do
  let(:user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }

  it 'renders access_granted email' do
    mail = described_class.access_granted(user, company)

    expect(mail.subject).to eq('Acesso liberado para a empresa')
    expect(mail.to).to eq([user.email])
    expect(mail.body.encoded).to include(company.name)
  end

  it 'renders access_rejected email' do
    mail = described_class.access_rejected(user, company, 'Nao autorizado')

    expect(mail.subject).to eq("Solicita\u00e7\u00e3o de acesso rejeitada")
    expect(mail.to).to eq([user.email])
    expect(mail.body.encoded).to include(company.name)
  end
end
