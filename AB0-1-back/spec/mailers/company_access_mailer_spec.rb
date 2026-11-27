require 'rails_helper'

RSpec.describe CompanyAccessMailer, type: :mailer do
  let(:user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }

  # Compara as partes decodificadas: o corpo bruto usa quoted-printable (quebra linhas longas)
  # e o HTML escapa caracteres como o apóstrofo de nomes gerados pelo Faker ("O'Keefe").
  def expect_company_name_in(mail)
    expect(mail.text_part.decoded).to include(company.name)
    expect(mail.html_part.decoded).to include(ERB::Util.html_escape(company.name))
  end

  it 'renders access_granted email' do
    mail = described_class.access_granted(user, company)

    expect(mail.subject).to eq('Acesso liberado para a empresa')
    expect(mail.to).to eq([user.email])
    expect_company_name_in(mail)
  end

  it 'renders access_rejected email' do
    mail = described_class.access_rejected(user, company, 'Nao autorizado')

    expect(mail.subject).to eq("Solicita\u00e7\u00e3o de acesso rejeitada")
    expect(mail.to).to eq([user.email])
    expect_company_name_in(mail)
  end
end
