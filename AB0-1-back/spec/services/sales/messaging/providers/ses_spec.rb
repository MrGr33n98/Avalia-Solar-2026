# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::Providers::Ses do
  let(:message) do
    instance_double(Sales::EmailMessage, body_html: '<p>Olá</p>', body_text: 'Olá', subject: 'Teste',
                    from_email: 'remetente@avaliasolar.test', to_email: 'destino@avaliasolar.test',
                    tracking_token: 'token', open_tracking_enabled: false, click_tracking_enabled: false,
                    participants: [], attachments: [])
  end

  around do |example|
    keys = %w[AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY SPACES_ACCESS_KEY_ID SPACES_SECRET_ACCESS_KEY]
    original = keys.to_h { |key| [key, ENV[key]] }
    keys.each { |key| ENV.delete(key) }
    example.run
  ensure
    original.each { |key, value| value ? ENV[key] = value : ENV.delete(key) }
  end

  it 'falha fechado sem credenciais e sem provider id' do
    result = described_class.new.send_message(message)

    expect(result.success?).to be(false)
    expect(result.provider_message_id).to be_nil
    expect(result.error_code).to eq('SES_NOT_CONFIGURED')
  end
end
