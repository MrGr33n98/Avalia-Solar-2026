# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'User Registration Flow (Devise)', type: :request do
  describe 'GET /users/sign_up' do
    it 'renders the Astryx split-card registration form with all required fields' do
      get '/users/sign_up'
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Criar uma conta')
      expect(response.body).to include('user[name]')
      expect(response.body).to include('user[email]')
      expect(response.body).to include('user[city]')
      expect(response.body).to include('user[state]')
      expect(response.body).to include('user[password]')
      expect(response.body).to include('user[password_confirmation]')
      expect(response.body).to include('user[terms_accepted]')
    end
  end

  describe 'POST /users' do
    let(:valid_params) do
      {
        user: {
          name: 'Felipe Henrique Test',
          email: "felipe.test.#{SecureRandom.hex(4)}@avaliasolar.test",
          city: 'Florianópolis',
          state: 'SC',
          password: 'Password123!',
          password_confirmation: 'Password123!',
          terms_accepted: '1'
        }
      }
    end

    it 'creates a new user successfully with city, state and terms' do
      expect do
        post '/users', params: valid_params
      end.to change(User, :count).by(1)

      expect(response).to have_http_status(:redirect)
      created_user = User.find_by(email: valid_params[:user][:email])
      expect(created_user).to be_present
      expect(created_user.name).to eq('Felipe Henrique Test')
      expect(created_user.city).to eq('Florianópolis')
      expect(created_user.state).to eq('SC')
      expect(created_user.terms_accepted).to be(true)
    end

    it 'rejects registration when city is blank' do
      invalid_params = valid_params.deep_dup
      invalid_params[:user][:city] = ''

      expect do
        post '/users', params: invalid_params
      end.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to match(/City can(&#39;|')t be blank|Cidade não pode ficar em branco/i)
    end

    it 'rejects registration when terms_accepted is unchecked' do
      invalid_params = valid_params.deep_dup
      invalid_params[:user][:terms_accepted] = '0'

      expect do
        post '/users', params: invalid_params
      end.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.body).to match(/Terms accepted must be accepted|Termos devem ser aceitos/i)
    end
  end
end
