require 'rails_helper'

RSpec.describe Sales::EmailEvent do
  it 'mantém o vocabulário de eventos sincronizado com o job de envio' do
    expected = %w[queued sent provider_accepted delivered open open_signal provider_open_signal click
                  provider_click_signal replied bounce complaint reject delivery_delay unsubscribed failed]
    expect(described_class::EVENT_TYPES).to include(*expected)
  end

  it 'rejeita evento desconhecido' do
    event = described_class.new(event_type: 'provider_success', occurred_at: Time.current)
    expect(event).not_to be_valid
    expect(event.errors[:event_type]).to be_present
  end

  it 'deduplica uma reentrega pelo dedupe key sem reaplicar contadores' do
    company = create(:company)
    user = create(:user, company: company)
    email = Sales::EmailMessage.create!(company: company, sender_user: user, from_email: user.email,
                                        to_email: 'prospect@example.test', subject: 'Mensagem sintética')

    2.times do
      email.register_event!(event_type: 'open_signal', source: 'avalia_pixel', dedupe_key: 'pixel:event:1',
                            signal_class: 'unknown')
    end

    expect(email.events.where(dedupe_key: 'pixel:event:1').count).to eq(1)
    expect(email.reload.raw_open_signals).to eq(1)
  end

  it 'não regride delivery quando eventos chegam fora de ordem' do
    company = create(:company)
    user = create(:user, company: company)
    email = Sales::EmailMessage.create!(company: company, sender_user: user, from_email: user.email,
                                        to_email: 'prospect@example.test', subject: 'Mensagem sintética')

    email.register_event!(event_type: 'delivered', source: 'aws_ses_sns', dedupe_key: 'delivery:1')
    email.register_event!(event_type: 'provider_accepted', source: 'aws_ses_api', dedupe_key: 'accepted:1')

    expect(email.reload.delivery_status).to eq('delivered')

    email.register_event!(event_type: 'reject', source: 'aws_ses_sns', dedupe_key: 'reject:1')
    expect(email.reload.delivery_status).to eq('delivered')
  end

  it 'não deixa um scanner consumir o clique único de um link' do
    company = create(:company)
    user = create(:user, company: company)
    email = Sales::EmailMessage.create!(company: company, sender_user: user, from_email: user.email,
                                        to_email: 'prospect@example.test', subject: 'Mensagem sintética')

    email.register_event!(event_type: 'click', source: 'avalia_link', signal_class: 'scanner',
                          payload: { email_link_id: 42 })
    email.register_event!(event_type: 'click', source: 'avalia_link', signal_class: 'unknown',
                          payload: { email_link_id: 42 })

    expect(email.reload.raw_clicks).to eq(2)
    expect(email.unique_clicks).to eq(1)
    expect(email.engagement_status).to eq('clicked')
  end
end
