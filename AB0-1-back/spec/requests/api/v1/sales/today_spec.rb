# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Today API', type: :request do
  describe 'GET /api/v1/sales/today' do
    context 'when unauthenticated' do
      it 'returns 401 Unauthorized' do
        get '/api/v1/sales/today'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    it 'retorna tarefas atribuídas ao vendedor atual por padrão' do
      company = create(:company)
      user = create(:user, company: company, role: :company)
      teammate = create(:user, company: company, role: :company)
      sales_role = Sales::Role.create!(name: 'Sales Rep', slug: "sales_rep_#{SecureRandom.hex(4)}", system: true)
      Sales::UserRole.create!(user: user, role: sales_role)
      Sales::UserRole.create!(user: teammate, role: sales_role)
      account = Sales::Account.create!(company: company, owner: user, name: 'Conta da equipe')
      own_task = Sales::Task.create!(
        sales_account_id: account.id, owner: user, task_type: 'call', title: 'Minha tarefa', due_at: Time.current
      )
      teammate_task = Sales::Task.create!(
        sales_account_id: account.id, owner: teammate, task_type: 'call', title: 'Tarefa do colega', due_at: Time.current
      )

      get '/api/v1/sales/today', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      today_ids = JSON.parse(response.body).fetch('today').pluck('id')
      expect(today_ids).to include(own_task.id)
      expect(today_ids).not_to include(teammate_task.id)
    end
  end

  private

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end
end
