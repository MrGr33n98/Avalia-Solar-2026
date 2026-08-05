require 'rails_helper'

RSpec.describe 'Estados de cadastro da autenticação', type: :request do
  let(:password) { 'Password123' }

  it 'não emite sessão antes da confirmação para consumidor' do
    post '/api/v1/auth/register', params: {
      user: {
        name: 'Pessoa Teste',
        email: 'pessoa@example.com',
        password: password,
        password_confirmation: password,
        role: 'review',
        city: 'São Paulo',
        state: 'SP',
        terms_accepted: true
      },
      terms_accepted: true
    }

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body).to include('state' => 'confirmation_required', 'code' => 'EMAIL_NOT_CONFIRMED')
    expect(body).not_to have_key('token')
  end

  it 'não emite sessão para empresa aguardando aprovação' do
    post '/api/v1/auth/register', params: {
      user: {
        name: 'Empresa Teste',
        email: 'contato@empresa.example',
        password: password,
        password_confirmation: password,
        role: 'company',
        terms_accepted: true
      },
      terms_accepted: true
    }

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body).to include('state' => 'pending_approval', 'code' => 'USER_NOT_APPROVED')
    expect(body).not_to have_key('token')
  end

  it 'recusa domínio público no cadastro de empresa' do
    post '/api/v1/auth/register', params: {
      user: {
        name: 'Empresa Teste',
        email: 'empresa@gmail.com',
        password: password,
        password_confirmation: password,
        role: 'company',
        terms_accepted: true
      },
      terms_accepted: true
    }

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).to_s).to include('deve ser corporativo')
  end
end
