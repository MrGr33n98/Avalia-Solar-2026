# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Reporting::EmailMetricsQuery do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:account) { Sales::Account.create!(name: 'Conta Teste', owner: user, company_id: company.id) }
  let(:email_message) do
    Sales::EmailMessage.create!(
      company: company,
      sender_user_id: user.id,
      sales_account: account,
      to_email: 'lead@exemplo.com.br',
      subject: 'Apresentação Solar',
      body_html: '<p>Teste</p>',
      delivery_status: 'delivered'
    )
  end

  before do
    Sales::EmailEvent.create!(
      email_message: email_message,
      company: company,
      event_type: 'provider_accepted',
      source: 'aws_ses_sns',
      signal_class: 'unknown',
      occurred_at: Time.current,
      received_at: Time.current
    )
    Sales::EmailEvent.create!(
      email_message: email_message,
      company: company,
      event_type: 'open_signal',
      source: 'avalia_pixel',
      signal_class: 'human_likely',
      occurred_at: Time.current,
      received_at: Time.current
    )
    Sales::EmailEvent.create!(
      email_message: email_message,
      company: company,
      event_type: 'provider_open_signal',
      source: 'aws_ses_sns',
      signal_class: 'proxy',
      occurred_at: Time.current,
      received_at: Time.current
    )
    Sales::EmailEvent.create!(
      email_message: email_message,
      company: company,
      event_type: 'provider_click_signal',
      source: 'aws_ses_sns',
      signal_class: 'human_likely',
      occurred_at: Time.current,
      received_at: Time.current
    )
  end

  it 'consolida métricas de e-mail considerando open_signal, provider_open_signal e provider_click_signal' do
    metrics = described_class.call(user: user)

    expect(metrics['sent']).to eq(1)
    expect(metrics['open']).to eq(2)
    expect(metrics['click']).to eq(1)
    expect(metrics['delivered']).to eq(0)
    expect(metrics['bounce']).to eq(0)
    expect(metrics['complaint']).to eq(0)
    expect(metrics['replied']).to eq(0)
  end
end
