require 'rails_helper'

RSpec.describe 'Api::V1::Billing Enterprise Leads API', type: :request do
  let(:plan) { Plan.find_by(name: 'Enterprise Plan') || create(:plan, name: 'Enterprise Plan') }
  let(:company) { create(:company, plan: plan) }
  let(:user) { create(:user, role: :company, company: company) }
  
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }
  let(:headers) { { 'Content-Type' => 'application/json' } }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
  end

  let!(:membership) { create(:company_member, company: company, user: user, role: :owner, status: 'active') }

  describe 'POST /api/v1/billing/enterprise_leads' do
    context 'quando não autenticado' do
      it 'retorna 401 unauthorized' do
        post '/api/v1/billing/enterprise_leads', params: { company_id: company.id, plan_id: plan.id }.to_json, headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'quando faltam parâmetros obrigatórios' do
      it 'retorna 422 unprocessable_entity' do
        params = { 
          company_id: company.id, 
          plan_id: plan.id, 
          justification: '', 
          phone_contact: '' 
        }.to_json

        post '/api/v1/billing/enterprise_leads', params: params, headers: auth_headers
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['error']).to eq('Justificativa e telefone de contato são obrigatórios.')
      end
    end

    context 'quando autenticado e com parâmetros válidos' do
      before do
        # Mocka a chamada de notificação do Slack
        allow(SlackNotificationService).to receive(:notify).and_return(true)
      end

      it 'cria a subscription no estado enterprise_lead com as notas corretas e envia Slack' do
        params = { 
          company_id: company.id, 
          plan_id: plan.id, 
          justification: 'Precisamos de suporte dedicado e API ilimitada.', 
          phone_contact: '11999999999',
          estimated_mrr: 'R$ 2.000/mês' 
        }.to_json

        post '/api/v1/billing/enterprise_leads', params: params, headers: auth_headers

        expect(response).to have_http_status(:created)
        payload = JSON.parse(response.body)
        expect(payload['message']).to include('Solicitação Enterprise registrada com sucesso')
        expect(payload['subscription_id']).to be_present

        # Verifica persistência no banco
        subscription = Billing::CompanySubscription.find(payload['subscription_id'])
        expect(subscription.status).to eq('enterprise_lead')
        expect(subscription.enterprise_notes).to include('Precisamos de suporte dedicado')
        expect(subscription.enterprise_notes).to include('11999999999')
        
        # Verifica se o Slack foi notificado
        expect(SlackNotificationService).to have_received(:notify).with(
          anything,
          anything,
          channel: :billing
        )
      end
    end
  end
end
