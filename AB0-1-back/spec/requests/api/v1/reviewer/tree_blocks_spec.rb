# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer Tree blocks API', type: :request do
  let(:reviewer) { create(:user, role: 'review', status: :active, confirmed_at: Time.current) }
  let!(:profile) { create(:reviewer_profile, user: reviewer, creator_enabled: true) }
  let(:token) { JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  it 'requires authentication' do
    post '/api/v1/reviewer/tree/blocks', params: { block: { block_type: 'external_link', title: 'Site', url: 'https://example.com' } }.to_json,
         headers: { 'Content-Type' => 'application/json' }

    expect(response).to have_http_status(:unauthorized)
  end

  it 'creates, lists, updates and deletes a block' do
    post '/api/v1/reviewer/tree/blocks', params: {
      block: { block_type: 'external_link', title: 'Site', subtitle: 'Meu site', url: 'https://example.com', active: true }
    }.to_json, headers: headers

    expect(response).to have_http_status(:created)
    block_id = JSON.parse(response.body).fetch('id')

    get '/api/v1/reviewer/tree/blocks', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('blocks').map { |item| item['id'] }).to include(block_id)

    patch "/api/v1/reviewer/tree/blocks/#{block_id}", params: { block: { title: 'Site atualizado' } }.to_json,
          headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('title')).to eq('Site atualizado')

    delete "/api/v1/reviewer/tree/blocks/#{block_id}", headers: headers
    expect(response).to have_http_status(:no_content)
  end

  it 'returns structured validation errors for unsafe URLs' do
    post '/api/v1/reviewer/tree/blocks', params: {
      block: { block_type: 'external_link', title: 'Site', url: 'javascript:alert(1)', active: true }
    }.to_json, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).dig('error', 'code')).to eq('validation_failed')
  end

  it 'returns active blocks from public creator tree and hides inactive blocks' do
    profile.update!(public_slug: 'creator-tree-spec', creator_enabled: true)
    create(:creator_tree_block, reviewer: profile, title: 'Visível', active: true, position: 0)
    create(:creator_tree_block, reviewer: profile, title: 'Oculto', active: false, position: 1)

    expect { get '/api/v1/creator_tree/creator-tree-spec' }
      .not_to change { profile.reload.tree_views_count }

    expect(response).to have_http_status(:ok)
    titles = JSON.parse(response.body).fetch('blocks').map { |block| block.fetch('title') }
    expect(titles).to eq(['Visível'])
  end

  it 'increments tree views only through the view endpoint' do
    profile.update!(public_slug: 'creator-tree-views', creator_enabled: true)

    expect do
      post '/api/v1/creator_tree/creator-tree-views/view'
    end.to change { profile.reload.tree_views_count }.by(1)

    expect(response).to have_http_status(:ok)
  end

  it 'increments clicks for active owned blocks' do
    profile.update!(public_slug: 'creator-tree-clicks', creator_enabled: true)
    block = create(:creator_tree_block, reviewer: profile, active: true)

    expect do
      post "/api/v1/creator_tree/creator-tree-clicks/blocks/#{block.id}/click"
    end.to change { block.reload.clicks_count }.by(1)
  end

  it 'rejects clicks for inactive or foreign blocks' do
    profile.update!(public_slug: 'creator-tree-owner', creator_enabled: true)
    inactive = create(:creator_tree_block, reviewer: profile, active: false)
    other_profile = create(:reviewer_profile, user: create(:user, role: :review), creator_enabled: true)
    foreign = create(:creator_tree_block, reviewer: other_profile, active: true)

    post "/api/v1/creator_tree/creator-tree-owner/blocks/#{inactive.id}/click"
    expect(response).to have_http_status(:not_found)

    post "/api/v1/creator_tree/creator-tree-owner/blocks/#{foreign.id}/click"
    expect(response).to have_http_status(:not_found)
  end

  it 'persists new blocks with public profile reviewer_id' do
    post '/api/v1/reviewer/tree/blocks', params: {
      block: { block_type: 'external_link', title: 'Owner check', url: 'https://example.com', active: true }
    }.to_json, headers: headers

    expect(response).to have_http_status(:created)
    expect(CreatorTreeBlock.order(:id).last.reviewer_id).to eq(profile.id)
  end
end
