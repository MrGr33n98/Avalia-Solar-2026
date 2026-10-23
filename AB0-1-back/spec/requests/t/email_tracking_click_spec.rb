# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /t/email/click/:token', type: :request do
  let(:company) { Company.new(name: 'Empresa Tracking', slug: 'empresa-tracking-1').tap { |c| c.save!(validate: false) } }
  let(:user) do
    User.new(name: 'Vendedor', email: 'vendedor-tracking@avaliasolar.com.br', password: 'Password123!',
             role: 'admin', company_id: company.id, terms_accepted: true).tap { |u| u.save!(validate: false) }
  end
  let(:account) { Sales::Account.create!(company_id: company.id, name: 'Conta Tracking', owner: user) }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'Ana', last_name: 'Lima', email: 'ana@cliente.com') }
  let(:target_url) { 'https://www.avaliasolar.com.br/planos' }

  def build_email(click_tracking_enabled:)
    Sales::EmailMessage.create!(
      company_id: company.id, sales_account_id: account.id, sales_contact_id: contact.id,
      sender_user_id: user.id, from_email: user.email, to_email: contact.email,
      subject: 'Teste de clique', body_text: 'Olá', status: 'sent',
      click_tracking_enabled: click_tracking_enabled
    )
  end

  def build_link(email, url = target_url)
    Sales::EmailLink.create!(email_message: email, token: SecureRandom.urlsafe_base64(24), original_url: url)
  end

  it 'registra o clique e redireciona quando o tracking de cliques está ativo' do
    link = build_link(build_email(click_tracking_enabled: true))

    expect { get "/t/email/click/#{link.token}", headers: { 'User-Agent' => 'Mozilla/5.0' } }
      .to change(Sales::EmailEvent.where(event_type: 'click'), :count).by(1)

    expect(response).to redirect_to(target_url)
    expect(link.reload.click_count).to eq(1)
  end

  it 'redireciona sem registrar telemetria quando o tracking de cliques foi desativado' do
    email = build_email(click_tracking_enabled: false)
    link = build_link(email)

    expect { get "/t/email/click/#{link.token}", headers: { 'User-Agent' => 'Mozilla/5.0' } }
      .not_to change(Sales::EmailEvent, :count)

    expect(response).to redirect_to(target_url)
    expect(link.reload.click_count).to eq(0)
    expect(email.reload.click_count).to eq(0)
  end

  it 'redireciona sem registrar telemetria quando destinatário está na lista de supressão' do
    email = build_email(click_tracking_enabled: true)
    Sales::EmailSuppression.create!(company_id: company.id, email: email.to_email, reason: 'unsubscribe')
    link = build_link(email)

    expect { get "/t/email/click/#{link.token}", headers: { 'User-Agent' => 'Mozilla/5.0' } }
      .not_to change(Sales::EmailEvent, :count)

    expect(response).to redirect_to(target_url)
    expect(link.reload.click_count).to eq(0)
  end

  it 'rejeita redirect aberto caso a URL de destino seja insegura' do
    email = build_email(click_tracking_enabled: true)
    link = build_link(email, 'javascript:alert(1)')

    get "/t/email/click/#{link.token}"
    expect(response).to redirect_to('/')
  end
end
