require 'rails_helper'

RSpec.describe VoiceReviews::WebhookIngestor, type: :service do
  let(:company) { create(:company) }
  let(:actor) { create(:user, company:) }
  let(:review_form) do
    ReviewForm.create!(company:, name: 'Voz', public_title: 'Avalie', form_type: 'general', status: 'active',
                       settings: ReviewForm::DEFAULT_SETTINGS)
  end
  let(:invite) do
    VoiceReviews::InviteService.call(company:, review_form:, actor:, kind: 'reusable_qr',
                                     idempotency_key: 'voice-test-idempotency-1')
  end
  let(:payload) do
    { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { messages: [{
      from: '5511999999999', id: 'wamid.voice.test.1', type: 'text',
      text: { body: "AVS #{invite.public_code}" }
    }] } }] }] }.to_json
  end

  before do
    allow(VoiceReviews::Config).to receive(:meta_app_secret).and_return('meta-test-secret')
  end

  it 'persists a valid message and deduplicates the provider id' do
    signature = "sha256=#{OpenSSL::HMAC.hexdigest('SHA256', 'meta-test-secret', payload)}"

    expect { described_class.call(raw_body: payload, signature:) }.to change(VoiceReviewMessage, :count).by(1)
    expect { described_class.call(raw_body: payload, signature:) }.not_to change(VoiceReviewSession, :count)
    expect(VoiceReviewSession.last.state).to eq('awaiting_consent')
  end

  it 'fails closed when the signature is invalid' do
    expect { described_class.call(raw_body: payload, signature: 'sha256=invalid') }
      .to raise_error(VoiceReviews::WebhookIngestor::InvalidSignature)
  end
end
