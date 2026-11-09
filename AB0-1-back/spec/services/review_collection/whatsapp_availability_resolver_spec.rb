require 'rails_helper'

RSpec.describe ReviewCollection::WhatsAppAvailabilityResolver, type: :service do
  let(:company) { create(:company, status: 'active') }

  before do
    allow(VoiceReviews::Config).to receive(:contact_pepper).and_return('review-invite-test-pepper')
    allow(VoiceReviews::Config).to receive(:enabled?).and_return(true)
    allow(VoiceReviews::Config).to receive(:provider).and_return('waha')
    allow(VoiceReviews::Config).to receive(:waha_api_key).and_return('test-key')
    allow(VoiceReviews::Config).to receive(:waha_webhook_hmac_secret).and_return('test-hmac')
    allow(VoiceReviews::Config).to receive(:whatsapp_number).and_return('5547999999999')
  end

  it 'fails closed by default without creating an invite on read' do
    expect {
      result = described_class.call(company: company)
      expect(result).to include(enabled: false, href: nil, landing_url: nil)
    }.not_to change(VoiceReviewInvite, :count)
  end

  it 'exposes the official Avalia Solar WhatsApp after explicit opt-in' do
    company.update!(voice_review_cta_enabled: true)
    result = described_class.call(company: company)

    expect(result[:enabled]).to eq(true)
    expect(result[:href]).to start_with('https://wa.me/5547999999999?text=')
    expect(result[:href]).to include('RV')
    expect(result[:landing_url]).to include('/v/')
  end

  it 'fails closed when WAHA is not configured' do
    company.update!(voice_review_cta_enabled: true)
    allow(VoiceReviews::Config).to receive(:waha_webhook_hmac_secret).and_return(nil)
    expect(described_class.call(company: company)[:enabled]).to eq(false)
  end
end
