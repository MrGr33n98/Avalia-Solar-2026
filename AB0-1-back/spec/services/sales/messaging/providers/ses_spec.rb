# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::Providers::Ses do
  let(:message_id) { 'crm-msg-id-12345' }
  let(:link_double) { double('EmailLink', token: 'link-token-123') }
  let(:links_relation) { double('LinksRelation', find_or_create_by!: link_double) }
  let(:email_message) do
    instance_double(
      Sales::EmailMessage,
      id: 42,
      message_id: message_id,
      body_html: '<p>Olá <a href="https://avaliasolar.com.br">link</a></p>',
      body_text: 'Olá',
      subject: 'Proposta CRM',
      from_email: 'remetente@avaliasolar.com.br',
      to_email: 'destino@cliente.com',
      tracking_token: 'token-abc',
      open_tracking_enabled: true,
      click_tracking_enabled: true,
      participants: [],
      attachments: [],
      links: links_relation
    )
  end

  around do |example|
    keys = %w[AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION AWS_SES_CONFIGURATION_SET SPACES_ACCESS_KEY_ID SPACES_SECRET_ACCESS_KEY]
    original = keys.to_h { |key| [key, ENV[key]] }
    keys.each { |key| ENV.delete(key) }
    example.run
  ensure
    original.each { |key, value| value ? ENV[key] = value : ENV.delete(key) }
  end

  it 'falha fechado sem credenciais e sem provider id' do
    result = described_class.new.send_message(email_message)

    expect(result.success?).to be(false)
    expect(result.provider_message_id).to be_nil
    expect(result.error_code).to eq('SES_NOT_CONFIGURED')
  end

  context 'com credenciais AWS configuradas' do
    let(:ses_client) { instance_double(Aws::SESV2::Client) }
    let(:ses_response) { double('SendEmailResponse', message_id: 'ses-msg-id-9999') }

    before do
      ENV['AWS_ACCESS_KEY_ID'] = 'mock-key'
      ENV['AWS_SECRET_ACCESS_KEY'] = 'mock-secret'
      ENV['AWS_REGION'] = 'us-east-1'
      ENV['AWS_SES_CONFIGURATION_SET'] = 'avalia-solar-crm'

      allow(Aws::SESV2::Client).to receive(:new).and_return(ses_client)
    end

    it 'não envia o header Message-ID no payload content.simple' do
      expect(ses_client).to receive(:send_email) do |request|
        simple = request.dig(:content, :simple)
        expect(simple).not_to be_nil
        expect(simple).not_to have_key(:headers)
        expect(request[:configuration_set_name]).to eq('avalia-solar-crm')
        expect(request[:from_email_address]).to eq('remetente@avaliasolar.com.br')
        expect(request[:destination][:to_addresses]).to eq(['destino@cliente.com'])
        ses_response
      end

      result = described_class.new.send_message(email_message)
      expect(result.success?).to be(true)
      expect(result.provider_message_id).to eq('ses-msg-id-9999')
    end

    it 'preserva to, cc e bcc baseados em participantes' do
      participant_to = instance_double('Participant', participant_type: 'to', email: 'to@cliente.com')
      participant_cc = instance_double('Participant', participant_type: 'cc', email: 'cc@cliente.com')
      participant_bcc = instance_double('Participant', participant_type: 'bcc', email: 'bcc@cliente.com')

      allow(email_message).to receive(:participants).and_return([participant_to, participant_cc, participant_bcc])

      expect(ses_client).to receive(:send_email) do |request|
        expect(request[:destination][:to_addresses]).to eq(['to@cliente.com'])
        expect(request[:destination][:cc_addresses]).to eq(['cc@cliente.com'])
        expect(request[:destination][:bcc_addresses]).to eq(['bcc@cliente.com'])
        ses_response
      end

      result = described_class.new.send_message(email_message)
      expect(result.success?).to be(true)
    end

    it 'aplica tracking HTML de abertura e clique corretamente' do
      expect(ses_client).to receive(:send_email) do |request|
        html_data = request.dig(:content, :simple, :body, :html, :data)
        expect(html_data).to include('/t/email/open/token-abc.gif')
        expect(html_data).to include('/t/email/click/link-token-123')
        ses_response
      end

      result = described_class.new.send_message(email_message)
      expect(result.success?).to be(true)
    end

    it 'retorna erro de envio quando o client SES lança exceção' do
      allow(ses_client).to receive(:send_email).and_raise(Aws::SESV2::Errors::ServiceError.new(double, 'Header <Message-ID> is not supported'))

      result = described_class.new.send_message(email_message)
      expect(result.success?).to be(false)
      expect(result.error_code).to eq('SES_SEND_ERROR')
      expect(result.error_message).to include('Header <Message-ID> is not supported')
    end
  end
end
