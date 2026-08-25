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
end
