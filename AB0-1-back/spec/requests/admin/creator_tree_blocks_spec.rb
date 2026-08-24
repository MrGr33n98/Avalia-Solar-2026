require 'rails_helper'

RSpec.describe 'ActiveAdmin Creator Tree Blocks', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) { create(:admin_user) }

  before { sign_in admin_user }

  it 'carrega o índice do Creator Tree' do
    get '/admin/creator_tree_blocks'

    expect(response).to have_http_status(:success)
  end

  it 'redireciona usuário não autenticado' do
    sign_out admin_user
    get '/admin/creator_tree_blocks'

    expect(response).to have_http_status(:redirect)
  end
end