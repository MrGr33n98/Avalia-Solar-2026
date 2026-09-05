require 'rails_helper'

RSpec.describe Sales::Campaigns::Preflight do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:template) { Sales::EmailTemplate.create!(company: company, name: 'Teste', subject_template: 'Assunto', body_html: '<p>Mensagem</p>') }
  let(:campaign) { Sales::Campaign.create!(company: company, user: user, email_template: template, name: 'Prévia', status: 'draft', campaign_type: 'email_broadcast') }

  it 'bloqueia público vazio apesar de o resultado conter metadados' do
    result = described_class.call(campaign: campaign)
    expect(result[:ready]).to eq(false)
    expect(result[:blockers].map { |item| item[:code] }).to include('EMPTY_AUDIENCE')
    expect(result[:audience][:estimated_count]).to eq(0)
  end

  it 'conta contatos reais, não chaves do hash de paginação' do
    account = Sales::Account.create!(company: company, owner: user, name: 'Conta')
    Sales::Contact.create!(sales_account_id: account.id, first_name: 'Contato', email: 'contato@example.test')
    result = described_class.call(campaign: campaign)
    expect(result[:audience][:estimated_count]).to eq(1)
    expect(result[:warnings].map { |item| item[:code] }).to include('SMALL_AUDIENCE')
  end
end
