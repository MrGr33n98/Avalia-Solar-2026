# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sitemaps API', type: :request do
  let(:category) { Category.create!(name: "Solar-#{SecureRandom.hex(4)}", description: 'Solar Category') }
  
  let(:owner) do
    User.create!(
      name: 'Owner User',
      email: "owner_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'São Paulo',
      terms_accepted: true
    )
  end

  let!(:public_group) do
    Group.create!(
      name: 'Public Community',
      slug: "public-#{SecureRandom.hex(4)}",
      visibility: 'public',
      status: 'active',
      owner: owner,
      category: category
    )
  end

  let!(:private_group) do
    Group.create!(
      name: 'Private Community',
      slug: "private-#{SecureRandom.hex(4)}",
      visibility: 'private_visible',
      status: 'active',
      owner: owner,
      category: category
    )
  end

  let!(:inactive_group) do
    Group.create!(
      name: 'Inactive Community',
      slug: "inactive-#{SecureRandom.hex(4)}",
      visibility: 'public',
      status: 'draft',
      owner: owner,
      category: category
    )
  end

  let!(:published_post) do
    GroupPost.create!(
      group: public_group,
      user: owner,
      title: 'Published Post',
      body: 'Body...',
      status: 'published'
    )
  end

  let!(:hidden_post) do
    GroupPost.create!(
      group: public_group,
      user: owner,
      title: 'Hidden Post',
      body: 'Body...',
      status: 'hidden'
    )
  end

  let!(:private_group_post) do
    GroupPost.create!(
      group: private_group,
      user: owner,
      title: 'Private Post',
      body: 'Body...',
      status: 'published'
    )
  end

  describe 'GET /api/v1/sitemaps/group_posts' do
    it 'returns only published posts in active public groups' do
      get '/api/v1/sitemaps/group_posts'

      expect(response).to have_http_status(:ok)
      
      json = JSON.parse(response.body)
      expect(json['data']).to be_an(Array)
      
      # Extract post IDs from the sitemap data
      post_ids = json['data'].map { |item| item['post_id'] }

      # Should include the published public post
      expect(post_ids).to include(published_post.id)

      # Should NOT include the hidden post
      expect(post_ids).not_to include(hidden_post.id)

      # Should NOT include the post from the private group
      expect(post_ids).not_to include(private_group_post.id)

      # Validate object schema keys
      item = json['data'].find { |d| d['post_id'] == published_post.id }
      expect(item).to have_key('group_slug')
      expect(item).to have_key('post_id')
      expect(item).to have_key('updated_at')
      expect(item['group_slug']).to eq(public_group.slug)
    end
  end
end
