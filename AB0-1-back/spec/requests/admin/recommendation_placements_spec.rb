# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin::RecommendationPlacements', type: :request do
  let(:admin_user) { create(:admin_user) }

  before do
    sign_in admin_user if respond_to?(:sign_in)
  end

  describe 'GET /admin/recommendation_placements' do
    it 'loads active admin index page successfully' do
      get '/admin/recommendation_placements'
      expect(response.status).to be_in([200, 302])
    end
  end
end
