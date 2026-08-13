require 'rails_helper'

RSpec.describe "Api::V1::Chat::LeadsController", type: :request do
  let(:session) { create(:chat_session) }

  describe "POST /api/v1/chat/leads" do
    let(:valid_params) do
      {
        chat_session_id: session.id,
        consent_given: true,
        name: 'João Solar',
        email: 'joao@example.com',
        phone: '11999999999'
      }
    end

    it "creates a new ChatLead successfully" do
      expect {
        post "/api/v1/chat/leads", params: valid_params
      }.to change(ChatLead, :count).by(1)

      expect(response).to have_http_status(:created)
      lead = ChatLead.last
      expect(lead.name).to eq('João Solar')
      expect(response.parsed_body).to include(
        'success' => true,
        'lead_id' => lead.id
      )
    end

    it "updates existing ChatLead instead of duplicating" do
      # Cria o lead prévio
      ChatLead.create!(
        chat_session_id: session.id,
        name: 'João Solar',
        email: 'joao@example.com',
        phone: '11999999999',
        consent_given: true,
        consent_given_at: Time.current
      )

      # Faz requisição com novo campo (vertical)
      update_params = valid_params.merge(vertical: 'residencial')

      expect {
        post "/api/v1/chat/leads", params: update_params
      }.not_to change(ChatLead, :count)

      expect(response).to have_http_status(:created)
      lead = ChatLead.find_by(chat_session_id: session.id)
      expect(lead.vertical).to eq('residencial')
    end

    it "does not overwrite good data with blank data" do
      ChatLead.create!(
        chat_session_id: session.id,
        name: 'João Solar',
        email: 'joao@example.com',
        phone: '11999999999',
        consent_given: true,
        consent_given_at: Time.current
      )

      # Requisicao simulando duplo submit com campo vazio
      malicious_params = valid_params.merge(name: '', email: nil)

      post "/api/v1/chat/leads", params: malicious_params

      lead = ChatLead.find_by(chat_session_id: session.id)
      expect(lead.name).to eq('João Solar') # Preservado
      expect(lead.email).to eq('joao@example.com') # Preservado
    end

    it "rescues ActiveRecord::RecordNotUnique and updates instead" do
      # Simula concorrência: Forçamos o find_or_initialize_by a retornar nova instância,
      # mas o save! vai lançar o erro de unique index porque o db já teria salvo.
      allow_any_instance_of(ChatLead).to receive(:save!).and_raise(ActiveRecord::RecordNotUnique)

      # E simulamos que a thread vencedora já criou o lead
      winner_lead = ChatLead.create!(
        chat_session_id: session.id,
        name: 'Thread Vencedora',
        email: 'vencedor@example.com',
        phone: '11999999999',
        consent_given: true,
        consent_given_at: Time.current
      )

      # Garantimos que a thread que perdeu a corrida cai no rescue e atualiza
      allow(ChatLead).to receive(:find_by!).with(chat_session_id: session.id).and_return(winner_lead)

      # Thread 2 tenta salvar com nome ligeiramente modificado (enriquecimento)
      loser_params = valid_params.merge(vertical: 'comercial')

      post "/api/v1/chat/leads", params: loser_params

      expect(response).to have_http_status(:created)
      expect(winner_lead.reload.vertical).to eq('comercial')
    end
  end
end
