require 'rails_helper'

RSpec.describe 'ActiveAdmin Creator Leads', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) { create(:admin_user) }

  before { sign_in admin_user }

  it 'carrega o índice dos leads de creators' do
    get '/admin/creator_leads'

    expect(response).to have_http_status(:success)
  end

  it 'carrega o scope de status sem erro de schema' do
    get '/admin/creator_leads', params: { scope: 'status_new' }

    expect(response).to have_http_status(:success)
  end

  it 'redireciona usuário não autenticado' do
    sign_out admin_user
    get '/admin/creator_leads'

    expect(response).to have_http_status(:redirect)
  end
end