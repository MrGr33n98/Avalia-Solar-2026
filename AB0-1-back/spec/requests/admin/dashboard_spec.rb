# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin Dashboard', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) { create(:admin_user) }

  context 'when signed in as admin' do
    before { sign_in admin_user }

    it 'renders the dashboard without HTTP 500' do
      get admin_dashboard_path

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Avalia Solar Ads')
      expect(response.body).to include('Estatísticas Globais')
      expect(response.body).to include('Plataforma Geral')
    end
  end

  context 'when unauthenticated' do
    it 'redirects to admin login page' do
      get admin_dashboard_path

      expect(response).to have_http_status(:redirect)
      expect(response).to redirect_to(new_admin_user_session_path)
    end
  end
end
