# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::ReferentialIntegrity', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:user_a) { create(:user, company: company_a, role: :company) }
  let(:user_b) { create(:user, company: company_b, role: :company) }

  let(:sales_role) do
    Sales::Role.create!(
      name: "Rep Vendas #{SecureRandom.hex(4)}",
      slug: "rep_vendas_#{SecureRandom.hex(4)}",
      system: true
    )
  end

  before do
    Sales::UserRole.create!(user: user_a, role: sales_role)
    Sales::UserRole.create!(user: user_b, role: sales_role)
  end

  let!(:account_a) { Sales::Account.create!(company: company_a, owner: user_a, name: 'Empresa A') }
  let!(:account_b) { Sales::Account.create!(company: company_b, owner: user_b, name: 'Empresa B') }

  let!(:contact_a) { Sales::Contact.create!(sales_account_id: account_a.id, first_name: 'Contact A', user: user_a) }
  let!(:contact_b) { Sales::Contact.create!(sales_account_id: account_b.id, first_name: 'Contact B', user: user_b) }

  let!(:pipeline) { Sales::Pipeline.create!(name: 'Pipeline RI', key: "ri_#{SecureRandom.hex(4)}", active: true) }
  let!(:stage) { pipeline.stages.create!(name: 'Novo', key: 'novo', position: 1, probability: 10) }
  let!(:opportunity_a) do
    Sales::Opportunity.create!(sales_account_id: account_a.id, primary_contact_id: contact_a.id, owner: user_a,
                               pipeline: pipeline, stage: stage, name: 'Oportunidade A')
  end
  let!(:opportunity_a2) do
    second_account = Sales::Account.create!(company: company_a, owner: user_a, name: 'Outra conta A')
    Sales::Opportunity.create!(sales_account_id: second_account.id, owner: user_a, pipeline: pipeline,
                               stage: stage, name: 'Oportunidade A2')
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  describe 'POST /api/v1/sales/tasks' do
    it 'rejects task creation referencing account from Tenant A and contact from Tenant B' do
      payload = {
        task: {
          title: 'Reunião Suspeita',
          sales_account_id: account_a.id,
          sales_contact_id: contact_b.id
        }
      }
      expect do
        post '/api/v1/sales/tasks', params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::Task, :count)
      expect(response).to have_http_status(:not_found)
    end

    it 'rejects individually visible but account-incompatible opportunity without writing' do
      payload = { task: { title: 'Tarefa incompatível', task_type: 'call', sales_account_id: account_a.id,
                          sales_opportunity_id: opportunity_a2.id } }
      expect do
        post '/api/v1/sales/tasks', params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::Task, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'creates a valid same-account task owned by the authenticated user' do
      payload = { task: { title: 'Tarefa válida', task_type: 'call', sales_account_id: account_a.id,
                          sales_contact_id: contact_a.id, sales_opportunity_id: opportunity_a.id } }
      expect do
        post '/api/v1/sales/tasks', params: payload, headers: auth_headers(user_a)
      end.to change(Sales::Task, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(Sales::Task.order(:id).last.owner_id).to eq(user_a.id)
    end
  end

  describe 'POST /api/v1/sales/activities' do
    it 'rejects activity referencing cross-tenant contact' do
      payload = { activity: { sales_contact_id: contact_b.id, activity_type: 'call', subject: 'Ligação' } }
      expect do
        post "/api/v1/sales/accounts/#{account_a.id}/activities", params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::Activity, :count)
      expect(response).to have_http_status(:not_found)
    end

    it 'rejects an opportunity from another visible account in the same tenant' do
      payload = { activity: { sales_opportunity_id: opportunity_a2.id, activity_type: 'call', subject: 'Ligação' } }
      expect do
        post "/api/v1/sales/accounts/#{account_a.id}/activities", params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::Activity, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'creates a valid activity with the authenticated actor' do
      payload = { activity: { sales_contact_id: contact_a.id, sales_opportunity_id: opportunity_a.id,
                              activity_type: 'call', subject: 'Ligação' } }
      expect do
        post "/api/v1/sales/accounts/#{account_a.id}/activities", params: payload, headers: auth_headers(user_a)
      end.to change(Sales::Activity, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(Sales::Activity.order(:id).last.actor_id).to eq(user_a.id)
    end
  end

  describe 'POST /api/v1/sales/contacts/:contact_id/employments' do
    it 'rejects employment link between contact of Tenant A and account of Tenant B' do
      payload = {
        employment: {
          sales_account_id: account_b.id,
          job_title: 'Diretor'
        }
      }
      expect do
        post "/api/v1/sales/contacts/#{contact_a.id}/employments", params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::ContactEmployment, :count)
      expect(response).to have_http_status(:not_found)
    end

    it 'allows a current employment to a second account in the same tenant' do
      account_a2 = opportunity_a2.account
      payload = { employment: { sales_account_id: account_a2.id, job_title: 'Diretor', relationship_type: 'employee', is_current: true } }
      expect do
        post "/api/v1/sales/contacts/#{contact_a.id}/employments", params: payload, headers: auth_headers(user_a)
      end.to change(Sales::ContactEmployment, :count).by(1)
      expect(response).to have_http_status(:created)
    end
  end

  describe 'POST /api/v1/sales/emails' do
    it 'rejects an out-of-tenant contact before persisting or enqueueing delivery' do
      payload = { email: { sales_account_id: account_a.id, sales_contact_id: contact_b.id,
                           to_email: 'cliente@example.com', subject: 'Proposta', body_text: 'Olá' } }
      enqueued_count = ActiveJob::Base.queue_adapter.enqueued_jobs.size

      expect do
        post '/api/v1/sales/emails', params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::EmailMessage, :count)
      expect(ActiveJob::Base.queue_adapter.enqueued_jobs.size).to eq(enqueued_count)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/sales/notes' do
    it 'rejects same-tenant contact and account references without a current employment' do
      account_a2 = opportunity_a2.account
      payload = { note: { account_id: account_a2.id, contact_id: contact_a.id, title: 'Nota incompatível', body: 'Texto' } }

      expect do
        post '/api/v1/sales/notes', params: payload, headers: auth_headers(user_a)
      end.not_to change(Sales::Note, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
