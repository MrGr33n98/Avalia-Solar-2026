require 'rails_helper'

RSpec.describe MaterialDownloadMailer, type: :mailer do
  let(:company) { create(:company, status: 'active') }
  let(:material) { create(:company_material, company: company) }
  let(:lead) { create(:content_lead, company: company) }
  let(:download) do
    MaterialDownload.create!(
      company: company,
      company_material: material,
      content_lead: lead,
      authorization_token_digest: 'a' * 64,
      authorized_at: Time.current,
      expires_at: 15.minutes.from_now,
      delivery_status: 'authorized'
    )
  end
  let(:token) { 'some_random_token_123' }

  it 'renders download_link email successfully' do
    mail = described_class.download_link(download, token)

    expect(mail.subject).to eq("Seu download do material da #{company.name} está pronto!")
    expect(mail.to).to eq([lead.email])
    expect(mail.body.encoded).to include(material.title)
    expect(mail.body.encoded).to include(token)
  end
end
