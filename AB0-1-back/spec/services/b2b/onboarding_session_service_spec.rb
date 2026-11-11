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
          cnpj: '11222333000181',
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
        allow(B2b::BrasilApiClient).to receive(:fetch).with('11222333000181').and_return(cnpj_payload)

        expect(gateway).to receive(:send_message).with(session, /Consultamos a base oficial da Receita Federal/)
        described_class.process_message!(session, { 'body' => '11.222.333/0001-81' })

        expect(session.reload.state).to eq('confirming_data')
        expect(session.current_step).to eq('confirm_data')
        expect(session.cnpj).to eq('11222333000181')
        expect(session.draft_data['cnpj_data']['razao_social']).to eq('SOLAR ENGENHARIA LTDA')
      end

      it 'warns if company with this CNPJ already exists' do
        create(:company, cnpj: '11222333000181', name: 'Empresa Existente')
        allow(B2b::BrasilApiClient).to receive(:fetch).and_return(cnpj_payload)

        expect(gateway).to receive(:send_message).with(session, /já possui cadastro no Avalia Solar/)
        described_class.process_message!(session, { 'body' => '11222333000181' })

        expect(session.reload.state).to eq('abandoned')
      end
    end

    context 'full progression to finalization' do
      let!(:cat71) { Category.find_by(id: 71) || Category.create!(id: 71, name: 'Energia Solar 71', slug: 'energia-solar-71', seo_url: 'energia-solar-71', description: 'Desc 71') }
      let!(:cat72) { Category.find_by(id: 72) || Category.create!(id: 72, name: 'Energia Solar 72', slug: 'energia-solar-72', seo_url: 'energia-solar-72', description: 'Desc 72') }

      let(:cnpj_data) do
        {
          'cnpj' => '06990590000123',
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
          cnpj: '06990590000123',
          current_step: 'confirm_data',
          state: 'confirming_data',
          draft_payload: { 'cnpj_data' => cnpj_data }
        )

        # 1. Confirma dados
        described_class.process_message!(session, { 'body' => '1' })
        expect(session.reload.current_step).to eq('ask_email')
        expect(session.state).to eq('awaiting_email')

        # 2. Informa e-mail de trabalho
        described_class.process_message!(session, { 'body' => 'contato@novasolar.com.br' })
        expect(session.reload.current_step).to eq('ask_segment')
        expect(session.state).to eq('awaiting_segment')
        expect(session.draft_data['user_email']).to eq('contato@novasolar.com.br')

        # 3. Escolhe segmento Residencial (Combo [71, 72])
        described_class.process_message!(session, { 'body' => '1' })
        expect(session.reload.current_step).to eq('ask_coverage')
        expect(session.state).to eq('awaiting_coverage')
        expect(session.draft_data['category_ids']).to eq([71, 72])
        expect(session.draft_data['primary_category_id']).to eq(71)

        # 4. Define raio de atendimento (Campinas e região)
        described_class.process_message!(session, { 'body' => '1' })
        expect(session.reload.current_step).to eq('ask_brands')
        expect(session.state).to eq('awaiting_brands')
        expect(session.draft_data['coverage_cities']).to eq('Campinas')

        # 5. Informa marcas -> avança para ask_logo
        described_class.process_message!(session, { 'body' => 'WEG, Growatt e Deye' })
        expect(session.reload.current_step).to eq('ask_logo')
        expect(session.state).to eq('awaiting_logo')
        expect(session.draft_data['brands']).to eq('WEG, Growatt e Deye')

        # 6. Pular etapa de logo -> avança para ask_photos
        described_class.process_message!(session, { 'body' => 'pular' })
        expect(session.reload.current_step).to eq('ask_photos')
        expect(session.state).to eq('awaiting_photos')

        # 7. Envia PULAR na etapa de fotos -> finaliza
        expect(gateway).to receive(:send_message).with(session, /Parabéns! Sua empresa foi cadastrada com sucesso/)
        expect(gateway).to receive(:send_message).with(session, /Felipe, fundador do Avalia Solar/)
        described_class.process_message!(session, { 'body' => 'pular' })

        session.reload
        expect(session.state).to eq('completed')
        expect(session.current_step).to eq('finish')
        expect(session.company).to be_present
        expect(session.company.status).to eq('active')
        expect(session.company.name).to eq('NOVA ENERGIA')
        expect(session.company.cnpj).to eq('06990590000123')
        expect(session.company.city).to eq('Campinas')
        expect(session.company.state).to eq('SP')
        expect(session.company.coverage_cities).to eq('Campinas')
        expect(session.company.category_ids).to include(71, 72)
        expect(session.company.primary_category_id).to eq(71)
        expect(session.user).to be_present
        expect(session.user.email).to eq('contato@novasolar.com.br')
        expect(session.user.status).to eq('active')
        expect(session.user.approved_by_admin).to be true
        expect(session.company.company_members.where(user: session.user, role: :owner)).to exist
      end

      it 'attaches company logo when image with base64 data is provided' do
        session.update!(current_step: 'ask_logo', state: 'awaiting_logo')
        fake_b64 = Base64.encode64('fake image content')

        expect(gateway).to receive(:send_message).with(session, /Logotipo registrado com sucesso/)
        described_class.process_message!(session, {
          'type' => 'image',
          'image' => {
            'data' => fake_b64,
            'mime_type' => 'image/png'
          }
        })

        expect(session.reload.current_step).to eq('ask_photos')
        expect(session.draft_data['logo_data']).to eq(fake_b64)
      end

      it 'updates password and associates existing user as company owner on onboarding finalization' do
        existing_user = User.create!(
          email: 'contato@novasolar.com.br',
          password: 'OldPassword123!',
          name: 'Old User',
          role: 'company',
          status: :active,
          approved_by_admin: true,
          terms_accepted: true,
          terms_accepted_at: Time.current,
          public_name_consent: true,
          display_full_name_consent: true,
          review_name_consent: true,
          lgpd_name_consent: true
        )

        session.update!(
          current_step: 'ask_photos',
          state: 'awaiting_photos',
          cnpj: '06990590000123',
          draft_payload: {
            'cnpj_data' => {
              'razao_social' => 'NOVA ENERGIA LTDA',
              'nome_fantasia' => 'NOVA ENERGIA',
              'municipio' => 'Campinas',
              'uf' => 'SP',
              'email' => 'financeiro@novasolar.com.br',
              'telefone' => '19987654321',
              'situacao' => 'ATIVA'
            },
            'user_email' => 'contato@novasolar.com.br',
            'category_ids' => [71, 72],
            'primary_category_id' => 71
          }
        )

        expect(gateway).to receive(:send_message).with(session, /Parabéns! Sua empresa foi cadastrada com sucesso/)
        expect(gateway).to receive(:send_message).with(session, /Felipe, fundador do Avalia Solar/)

        described_class.process_message!(session, { 'body' => 'pular' })

        session.reload
        expect(session.state).to eq('completed')
        expect(session.user).to eq(existing_user)
        expect(session.company.company_members.where(user: existing_user, role: :owner, status: :active)).to exist

        # A senha antiga não é mais válida; o usuário foi sincronizado
        expect(existing_user.reload.valid_password?('OldPassword123!')).to be false
      end
    end
  end
end
