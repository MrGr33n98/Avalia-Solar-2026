require 'rails_helper'

RSpec.describe "Admin Reputação", type: :request do
  include Devise::Test::IntegrationHelpers
  let(:admin_user) { create(:admin_user) }

  before { sign_in admin_user }

  it 'abre Hub e mostra métricas sem reviews fictícias' do
    get admin_reputacao_path

    expect(response).to have_http_status(:success)
    expect(response.body).to include('Reputação', 'Avaliações aprovadas', 'Trust Score: visão derivada, não é nota')
    expect(response.body).not_to include('4,5 fictício')
  end

  it "redireciona usuário não autenticado" do
    sign_out admin_user
    get admin_reputacao_path
    expect(response).to have_http_status(:redirect)
  end
end
