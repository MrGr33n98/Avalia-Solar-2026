require 'rails_helper'

RSpec.describe VoiceReviews::WahaWebhookIngestor do
  let(:secret) { 'waha-test-secret' }
  let(:timestamp) { (Time.current.to_f * 1000).to_i.to_s }
  let(:body) do
    {
      event: 'message', session: 'avalia-solar-voice', payload: {
        id: 'true_5511999999999@c.us_ABC', timestamp: Time.current.to_i,
        from: '5511999999999@c.us', fromMe: false, body: '', hasMedia: true,
        media: { url: 'http://localhost:3000/api/files/audio.ogg', mimetype: 'audio/ogg; codecs=opus' }
      }
    }.to_json
  end
  let(:signature) { OpenSSL::HMAC.hexdigest('SHA512', secret, body) }

  before do
    allow(VoiceReviews::Config).to receive(:waha_webhook_hmac_secret).and_return(secret)
    allow(VoiceReviews::MessageIngestor).to receive(:call)
  end

  it 'valida HMAC, timestamp e normaliza áudio para o ingestor' do
    described_class.call(raw_body: body, signature:, timestamp:, algorithm: 'sha512')

    expect(VoiceReviews::MessageIngestor).to have_received(:call).with(
      hash_including(provider: 'waha', provider_session: 'avalia-solar-voice', raw_body: body)
    )
  end

  it 'rejeita timestamp ausente' do
    expect {
      described_class.call(raw_body: body, signature: signature, timestamp: '', algorithm: 'sha512')
    }.to raise_error(described_class::InvalidSignature)
  end

  it 'rejeita segredo não configurado mesmo com IP interno' do
    allow(VoiceReviews::Config).to receive(:waha_webhook_hmac_secret).and_return(nil)
    expect {
      described_class.call(raw_body: body, signature: signature, timestamp: timestamp, algorithm: 'sha512', remote_ip: '172.16.1.2')
    }.to raise_error(described_class::InvalidSignature)
  end

  it 'rejeita assinatura ausente mesmo dentro do Docker' do
    expect {
      described_class.call(raw_body: body, signature: '', timestamp: timestamp, algorithm: 'sha512', remote_ip: '127.0.0.1')
    }.to raise_error(described_class::InvalidSignature)
  end

  it 'rejeita assinatura inválida' do
    expect {
      described_class.call(raw_body: body, signature: 'invalid', timestamp:, algorithm: 'sha512')
    }.to raise_error(described_class::InvalidSignature)
  end
end
