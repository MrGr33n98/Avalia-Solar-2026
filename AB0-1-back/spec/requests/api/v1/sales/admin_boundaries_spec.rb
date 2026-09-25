# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::AdminBoundaries', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:admin_user) { create(:user, company: company_a, role: :admin) }
  let(:other_user) { create(:user, company: company_b, role: :company) }

  let!(:account_a) { Sales::Account.create!(company: company_a, owner: admin_user, name: 'Empresa A') }
  let!(:account_b) { Sales::Account.create!(company: company_b, owner: other_user, name: 'Empresa B') }

  let!(:contact_a) { Sales::Contact.create!(sales_account_id: account_a.id, first_name: 'Contact A', user: admin_user) }
  let!(:contact_b) { Sales::Contact.create!(sales_account_id: account_b.id, first_name: 'Contact B', user: other_user) }
  let!(:admin_task) do
    Sales::Task.create!(sales_account_id: account_a.id, owner: admin_user, task_type: 'call', title: 'Tarefa admin')
  end
  let!(:other_task) do
    Sales::Task.create!(sales_account_id: account_b.id, owner: other_user, task_type: 'call', title: 'Tarefa tenant B')
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  describe 'Admin user operations' do
    it 'allows admin to query records globally' do
      expect(admin_user).to be_admin
      expect(Sales::TenantScope.new(admin_user).accounts.pluck(:id)).to include(account_a.id, account_b.id)
      get '/api/v1/sales/accounts?per_page=100', headers: auth_headers(admin_user)
      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body)['accounts'].map { |acc| acc['id'] }
      expect(ids).to include(account_a.id)
      expect(ids).to include(account_b.id)
    end

    it 'rejects cross-tenant relation creation even when user is an admin' do
      payload = {
        task: {
          title: 'Admin Cross Task',
          sales_account_id: account_a.id,
          sales_contact_id: contact_b.id
        }
      }
      post '/api/v1/sales/tasks', params: payload, headers: auth_headers(admin_user)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'keeps task lists owner-only for admins' do
      get '/api/v1/sales/tasks', headers: auth_headers(admin_user)
      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body)['tasks'].map { |task| task['id'] }
      expect(ids).to include(admin_task.id)
      expect(ids).not_to include(other_task.id)
    end
  end
end
