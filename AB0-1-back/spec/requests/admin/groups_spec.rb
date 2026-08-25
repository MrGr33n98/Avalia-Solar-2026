require 'rails_helper'

RSpec.describe 'ActiveAdmin Groups', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) { create(:admin_user) }

  around do |example|
    original = ENV['GROUPS_ENABLED']
    ENV['GROUPS_ENABLED'] = 'true'
    example.run
    ENV['GROUPS_ENABLED'] = original
  end

  before { sign_in admin_user }

  it 'carrega o índice de comunidades após schema verificado' do
    get '/admin/groups'

    expect(response).to have_http_status(:success)
  end

  it 'carrega o índice de memberships' do
    get '/admin/group_memberships'

    expect(response).to have_http_status(:success)
  end

  it 'consegue atualizar e publicar um grupo com status draft' do
    group = create(:group, status: 'draft')

    patch "/admin/groups/#{group.id}", params: { group: { status: 'active' } }

    expect(response).to have_http_status(:redirect)
    expect(group.reload.status).to eq('active')
  end
end
