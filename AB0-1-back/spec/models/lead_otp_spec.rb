require 'rails_helper'

RSpec.describe Lead, type: :model do
  let(:lead) do
    Lead.create!(
      name: 'Lead OTP',
      email: 'lead@example.com',
      phone: '11999999999',
      product_vertical: 'Energia Solar',
      project_profile: 'Residencial',
      quote_type: 'Energia Solar',
      system_size_band: 'Ate 7 kWp',
      decision_timeline: 'Agora',
      address_full: 'Rua B, 100 - Rio de Janeiro/RJ',
      city: 'Rio de Janeiro',
      state: 'RJ',
      consent_at: Time.current,
      consent_ip: '127.0.0.1',
      wizard_status: 'pending_otp'
    )
  end

  it 'marks otp as expired when time window is exceeded' do
    lead.update!(otp_sent_at: 11.minutes.ago)
    expect(lead.otp_expired?).to be(true)
  end

  it 'marks otp attempts as exceeded at limit' do
    lead.update!(otp_attempts: 5)
    expect(lead.otp_attempts_exceeded?).to be(true)
  end

  it 'validates otp against stored digest' do
    allow(Lead).to receive(:generate_otp_code).and_return('123456')
    lead.generate_otp!

    expect(lead.valid_otp?('123456')).to be(true)
    expect(lead.valid_otp?('000000')).to be(false)
  end
end
