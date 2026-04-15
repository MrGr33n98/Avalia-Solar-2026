require 'rails_helper'

RSpec.describe 'Admin Categories', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  before do
    sign_in admin_user
  end

  describe 'GET /admin/categories' do
    it 'loads the index without errors' do
      get '/admin/categories'

      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /admin/categories/new' do
    it 'loads the form without errors' do
      get '/admin/categories/new'

      expect(response).to have_http_status(:success)
      expect(response.body).to include('Basic Information')
      expect(response.body).not_to include('Lead Wizard Settings')
    end
  end

  describe 'POST /admin/categories' do
    it 'creates a category without a lead wizard' do
      expect do
        post '/admin/categories', params: {
          category: {
            name: 'Categoria Admin Sem Wizard',
            description: 'Categoria criada pelo admin',
            status: 'active',
            kind: 'main',
            featured: '0',
            permissions_config: {}
          }
        }
      end.to change(Category, :count).by(1)

      category = Category.order(:id).last
      expect(response).to redirect_to(admin_category_path(category))
    end

    it 'creates a category and ignores legacy wizard params' do
      expect do
        post '/admin/categories', params: {
          category: {
            name: 'Categoria Admin Wizard Vazio',
            description: 'Categoria criada pelo admin',
            status: 'active',
            kind: 'main',
            featured: '0',
            permissions_config: {},
            category_lead_wizard_attributes: {
              enabled: '1',
              template_key: 'solar',
              template_version: '1',
              schema: '{"steps":[{"id":"legacy"}]}',
              thank_you_config: '{"title":"Obrigado"}'
            }
          }
        }
      end.to change(Category, :count).by(1)
         .and change(CategoryLeadWizard, :count).by(0)

      category = Category.order(:id).last
      expect(response).to redirect_to(admin_category_path(category))
    end
  end
end
