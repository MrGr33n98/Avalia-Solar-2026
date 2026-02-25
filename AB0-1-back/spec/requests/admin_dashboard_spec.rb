require 'rails_helper'

RSpec.describe 'Admin Dashboard', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.create!(
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  let!(:category) do
    Category.create!(
      name: 'Solar',
      description: 'Categoria de testes',
      permissions_config: { 'can_view_leads' => true, 'max_leads_per_day' => 5 }
    )
  end

  before do
    sign_in admin_user
  end

  it 'carrega o dashboard com sucesso' do
    get '/admin'
    expect(response).to have_http_status(:success)
    expect(response.body).to include('Dashboard')
    expect(response.body).to include('Empresas Recentes')
  end

  it 'permite salvar e ler configurações de permissão na categoria' do
    category.reload
    expect(category.permissions_config).to eq({ 'can_view_leads' => true, 'max_leads_per_day' => 5 })

    new_config = { 'can_view_leads' => false, 'max_leads_per_day' => 10 }
    category.update!(permissions_config: new_config)

    expect(category.reload.permissions_config).to eq(new_config)
  end
end
