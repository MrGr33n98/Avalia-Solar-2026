# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Social follows API', type: :request do
  let(:user) { create(:user, role: 'review') }
  let(:category) { create(:category) }
  let(:headers) { auth_headers_for(user) }
  let(:follow_params) { { followable_type: 'Category', followable_id: category.id } }

  describe 'POST /api/v1/follows' do
    it 'cria follow' do
      expect do
        post '/api/v1/follows', params: follow_params, headers: headers
      end.to change(SocialFollow, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(SocialFollow.exists?(follower: user, followable: category)).to be(true)
    end

    it 'é idempotente para follow duplicado' do
      2.times { post '/api/v1/follows', params: follow_params, headers: headers }

      expect(response).to have_http_status(:ok)
      expect(SocialFollow.where(follower: user, followable: category).count).to eq(1)
    end

    it 'recupera o registro quando outra requisição vence a corrida de inserção' do
      original_create = SocialFollow.method(:create!)
      allow(SocialFollow).to receive(:create!) do |attributes|
        original_create.call(attributes)
        raise ActiveRecord::RecordNotUnique
      end

      post '/api/v1/follows', params: follow_params, headers: headers

      expect(response).to have_http_status(:ok)
      expect(SocialFollow.where(follower: user, followable: category).count).to eq(1)
    end

    it 'bloqueia self-follow' do
      profile = create(:reviewer_profile, user: user)

      post '/api/v1/follows',
           params: { followable_type: 'ReviewerProfile', followable_id: profile.id },
           headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(SocialFollow.exists?(follower: user, followable: profile)).to be(false)
    end

    it 'rejeita usuário não autenticado' do
      post '/api/v1/follows', params: follow_params

      expect(response).to have_http_status(:unauthorized)
      expect(SocialFollow.count).to eq(0)
    end
  end

  describe 'DELETE /api/v1/follows' do
    it 'remove follow' do
      SocialFollow.create!(follower: user, followable: category)

      expect do
        delete '/api/v1/follows', params: follow_params, headers: headers
      end.to change(SocialFollow, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end

    it 'é idempotente para unfollow repetido' do
      SocialFollow.create!(follower: user, followable: category)

      2.times { delete '/api/v1/follows', params: follow_params, headers: headers }

      expect(response).to have_http_status(:ok)
      expect(SocialFollow.where(follower: user, followable: category)).to be_empty
    end

    it 'não remove follow pertencente a outro usuário' do
      other_user = create(:user, role: 'review')
      follow = SocialFollow.create!(follower: user, followable: category)

      delete '/api/v1/follows', params: follow_params, headers: auth_headers_for(other_user)

      expect(response).to have_http_status(:ok)
      expect(follow.reload).to be_persisted
    end

    it 'rejeita usuário não autenticado' do
      delete '/api/v1/follows', params: follow_params

      expect(response).to have_http_status(:unauthorized)
    end
  end

  private

  def auth_headers_for(target_user)
    token = JWT.encode(
      { user_id: target_user.id, typ: 'access' },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}" }
  end
end
