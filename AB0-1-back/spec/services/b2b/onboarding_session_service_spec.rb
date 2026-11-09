# frozen_string_literal: true

require 'rails_helper'

RSpec.describe B2b::OnboardingSessionService do
  let(:contact) { '5511999998888' }
  let(:gateway) { instance_double(VoiceReviews::ContinuationLink::FakeGateway) }

  before do
    allow(VoiceReviews::ContinuationLink).to receive(:gateway).and_return(gateway)
    allow(gateway).to receive(:send_message)
  end

  describe '.open!' do
    it 'creates a new CompanyOnboardingSession in awaiting_cnpj state and sends greeting' do
      expect(gateway).to receive(:send_message).with(
        an_instance_of(CompanyOnboardingSession),
        /Boas-vindas ao portal \*Avalia Solar\*/
      )

      session = described_class.open!(contact: contact, sender_name: 'Carlos Solar')
      expect(session).to be_persisted
      expect(session.state).to eq('awaiting_cnpj')
      expect(session.current_step).to eq('ask_cnpj')
      expect(session.provider_contact).to eq(contact)
      expect(session.draft_data['sender_name']).to eq('Carlos Solar')
    end

    it 'abandons previous active session for the same contact' do
      first_session = described_class.open!(contact: contact)
      second_session = described_class.open!(contact: contact)

      expect(first_session.reload.state).to eq('abandoned')
      expect(second_session.state).to eq('awaiting_cnpj')
    end
  end

  describe '.process_message!' do
    let(:session) { described_class.open!(contact: contact) }

    context 'when user wants to cancel' do
      it 'marks session as abandoned and sends cancellation message' do
        expect(gateway).to receive(:send_message).with(session, /Cadastro cancelado/)
        described_class.process_message!(session, { 'body' => 'cancelar' })
        expect(session.reload.state).to eq('abandoned')
      end
    end

    context 'when in ask_cnpj step' do
      let(:cnpj_payload) do
        {
          success: true,
          cnpj: '12345678000199',
          razao_social: 'SOLAR ENGENHARIA LTDA',
          nome_fantasia: 'SOLAR CAMPINAS',
          situacao: 'ATIVA',
          logradouro: 'RUA DAS PLACAS',
          numero: '100',
          bairro: 'CENTRO',
          municipio: 'CAMPINAS',
          uf: 'SP',
          cep: '13010000',
          cnae_descricao: 'Instalação e manutenção elétrica',
          email: 'contato@solarcampinas.com.br'
        }
      end

      it 'validates CNPJ via BrasilApiClient and transitions to confirming_data' do
        allow(B2b::BrasilApiClient).to receive(:fetch).with('12345678000199').and_return(cnpj_payload)

        expect(gateway).to receive(:send_message).with(session, /Consultamos a base oficial da Receita Federal/)
        described_class.process_message!(session, { 'body' => '12.345.678/0001-99' })

        expect(session.reload.state).to eq('confirming_data')
        expect(session.current_step).to eq('confirm_data')
        expect(session.cnpj).to eq('12345678000199')
        expect(session.draft_data['cnpj_data']['razao_social']).to eq('SOLAR ENGENHARIA LTDA')
      end

      it 'warns if company with this CNPJ already exists' do
        create(:company, cnpj: '12345678000199', name: 'Empresa Existente')
        allow(B2b::BrasilApiClient).to receive(:fetch).and_return(cnpj_payload)

        expect(gateway).to receive(:send_message).with(session, /já possui cadastro no Avalia Solar/)
        described_class.process_message!(session, { 'body' => '12345678000199' })

        expect(session.reload.state).to eq('abandoned')
      end
    end

    context 'full progression to finalization' do
      let(:cnpj_data) do
        {
          'cnpj' => '98765432000188',
          'razao_social' => 'NOVA ENERGIA SOLAR LTDA',
          'nome_fantasia' => 'NOVA ENERGIA',
          'situacao' => 'ATIVA',
          'logradouro' => 'AV BRASIL',
          'numero' => '500',
          'bairro' => 'JARDINS',
          'municipio' => 'CAMPINAS',
          'uf' => 'SP',
          'cep' => '13000000',
          'cnae_descricao' => 'Instalação de painéis',
          'email' => 'novasolar@example.com'
        }
      end

      it 'completes onboarding creating Company, User and CompanyMember' do
        session.update!(
          cnpj: '98765432000188',
          current_step: 'confirm_data',
          state: 'confirming_data',
          draft_payload: { 'cnpj_data' => cnpj_data }
        )

        # 1. Confirma dados
        described_class.process_message!(session, { 'body' => '1' })
        expect(session.reload.current_step).to eq('ask_segment')

        # 2. Escolhe segmento Residencial
        described_class.process_message!(session, { 'body' => '1' })
        expect(session.reload.current_step).to eq('ask_brands')
        expect(session.draft_data['segment_focus']).to eq('Residencial')

        # 3. Informa marcas
        described_class.process_message!(session, { 'body' => 'WEG, Growatt e Deye' })
        expect(session.reload.current_step).to eq('ask_photos')
        expect(session.draft_data['brands']).to eq('WEG, Growatt e Deye')

        # 4. Envia PULAR na etapa de fotos
        expect(gateway).to receive(:send_message).with(session, /Parabéns! Sua empresa foi cadastrada com sucesso/)
        described_class.process_message!(session, { 'body' => 'pular' })

        session.reload
        expect(session.state).to eq('completed')
        expect(session.current_step).to eq('finish')
        expect(session.company).to be_present
        expect(session.company.name).to eq('NOVA ENERGIA')
        expect(session.company.cnpj).to eq('98765432000188')
        expect(session.company.city).to eq('CAMPINAS')
        expect(session.company.state).to eq('SP')
        expect(session.user).to be_present
        expect(session.company.company_members.where(user: session.user, role: :owner)).to exist
      end
    end
  end
end
