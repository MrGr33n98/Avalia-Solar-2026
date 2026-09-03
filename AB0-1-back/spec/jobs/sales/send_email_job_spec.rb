# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::SendEmailJob, type: :job do
  let(:company) { Company.new(name: 'Empresa Teste', slug: 'empresa-teste-1').tap { |c| c.save!(validate: false) } }
  let(:user) do
    User.new(
      name: 'Vendedor Teste',
      email: 'vendedor@avaliasolar.com.br',
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end

  let(:account) { Sales::Account.create!(company_id: company.id, name: 'Conta Teste', owner: user) }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'João', last_name: 'Silva', email: 'joao@cliente.com') }

  let(:thread) do
    Sales::EmailThread.create!(
      company_id: company.id,
      sales_account_id: account.id,
      sales_contact_id: contact.id,
      subject_normalized: 'proposta comercial',
      first_message_at: Time.current,
      last_message_at: Time.current
    )
  end

  let(:email) do
    Sales::EmailMessage.create!(
      company_id: company.id,
      sales_email_thread_id: thread.id,
      sales_account_id: account.id,
      sales_contact_id: contact.id,
      sender_user_id: user.id,
      from_email: user.email,
      to_email: contact.email,
      subject: 'Proposta Comercial Usina 100kWp',
      body_text: 'Olá João, segue proposta comercial.',
      body_html: '<p>Olá João, segue proposta comercial.</p>',
      status: 'queued'
    )
  end

  subject(:job) { described_class.new }

  describe 'visibilidade de métodos privados' do
    it 'responde internamente a body_with_signature, text_with_signature e signature_for' do
      expect(job.private_methods).to include(:body_with_signature, :text_with_signature, :signature_for)
      expect { job.send(:body_with_signature, email) }.not_to raise_error
      expect { job.send(:text_with_signature, email) }.not_to raise_error
    end
  end

  describe '#perform' do
    context 'quando o provider SES retorna sucesso' do
      let(:mock_result) do
        double('SesResult', success?: true, provider_message_id: '0100018f-ses-mock-12345', error_message: nil)
      end

      before do
        allow_any_instance_of(Sales::Messaging::Providers::Ses).to receive(:send_message).and_return(mock_result)
      end

      it 'executa o Renderer e transiciona status queued -> sent persistindo provider_message_id e evento' do
        expect {
          job.perform(email.id)
        }.to change { email.reload.status }.from('queued').to('sent')
         .and change(Sales::EmailEvent, :count).by(1)

        expect(email.provider_message_id).to eq('0100018f-ses-mock-12345')
        expect(email.sent_at).not_to be_nil
        expect(email.events.last.event_type).to eq('sent')
      end

      it 'envia com sucesso e-mail sem assinatura' do
        job.perform(email.id)
        expect(email.reload.status).to eq('sent')
        expect(email.body_html).to include('Olá João, segue proposta comercial.')
      end

      it 'acrescenta assinatura HTML e texto quando existe assinatura padrão do usuário' do
        Sales::EmailSignature.create!(
          company_id: company.id,
          user_id: user.id,
          name: 'Assinatura Comercial',
          body_html: '<p>Atenciosamente,<br><b>Vendedor Teste</b></p>',
          is_default: true
        )

        job.perform(email.id)
        email.reload

        expect(email.status).to eq('sent')
        expect(email.body_html).to include('Vendedor Teste')
        expect(email.body_text).to include('Vendedor Teste')
      end

      it 'executa sem erro mesmo quando account e contact são nil (outbound manual)' do
        manual_email = Sales::EmailMessage.create!(
          company_id: company.id,
          sales_email_thread_id: thread.id,
          sales_account_id: nil,
          sales_contact_id: nil,
          sender_user_id: user.id,
          from_email: user.email,
          to_email: 'outbound.direto@cliente.com',
          subject: 'Contato Direto',
          body_text: 'Mensagem manual',
          status: 'queued'
        )

        expect {
          job.perform(manual_email.id)
        }.not_to raise_error

        expect(manual_email.reload.status).to eq('sent')
        expect(manual_email.provider_message_id).to eq('0100018f-ses-mock-12345')
      end
    end

    context 'quando o provider SES retorna falha' do
      let(:mock_failure) do
        double('SesResult', success?: false, provider_message_id: nil, error_message: 'Email address rejected by SES')
      end

      before do
        allow_any_instance_of(Sales::Messaging::Providers::Ses).to receive(:send_message).and_return(mock_failure)
      end

      it 'transiciona status para failed e persiste a mensagem de erro no metadata' do
        expect {
          job.perform(email.id)
        }.to change { email.reload.status }.from('queued').to('failed')

        expect(email.metadata['error']).to eq('Email address rejected by SES')
        expect(email.events.last.event_type).to eq('failed')
      end
    end
  end
end
