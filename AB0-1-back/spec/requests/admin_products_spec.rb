require 'rails_helper'

RSpec.describe 'Admin::Products', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let!(:category) do
    Category.create!(
      name: 'Solar',
      description: 'Solar Energy'
    )
  end

  let!(:company1) do
    Company.create!(
      name: 'Company 1',
      slug: 'company-1',
      description: 'Description 1',
      status: 'active',
      email: 'company1@example.com',
      state: 'AC',
      city: 'Rio Branco',
      phone: '11999999999',
      categories: [category]
    )
  end

  let!(:company2) do
    Company.create!(
      name: 'Company 2',
      slug: 'company-2',
      description: 'Description 2',
      status: 'active',
      email: 'company2@example.com',
      state: 'AL',
      city: 'Maceió',
      phone: '11888888888',
      categories: [category]
    )
  end

  let!(:product1) do
    Product.create!(
      name: 'Product 1',
      description: 'Description 1',
      price: 100.0,
      company: company1,
      sku: 'SKU1'
    )
  end

  let!(:product2) do
    Product.create!(
      name: 'Product 2',
      description: 'Description 2',
      price: 200.0,
      company: company2,
      sku: 'SKU2'
    )
  end

  before do
    sign_in admin_user
  end

  describe 'GET /admin/products' do
    it 'returns all products' do
      get '/admin/products'
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Product 1')
      expect(response.body).to include('Product 2')
    end

    it 'filters products by company_id param (non-nested)' do
      get "/admin/products?company_id=#{company1.slug}"
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Product 1')
      expect(response.body).not_to include('Product 2')
    end
  end

  describe 'GET /admin/companies/:company_id/products' do
    it 'returns products only for the nested company' do
      get "/admin/companies/#{company1.slug}/products"
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Product 1')
      expect(response.body).not_to include('Product 2')
    end
  end

  describe 'GET /admin/products/new' do
    it 'loads without error' do
      get '/admin/products/new'
      expect(response).to have_http_status(:success)
    end

    it 'pre-selects company if company_id param is present' do
      get "/admin/products/new?company_id=#{company1.slug}"
      expect(response).to have_http_status(:success)
      # Check if company is selected in the form
      expect(response.body).to include("selected=\"selected\" value=\"#{company1.id}\">#{company1.name}")
    end
  end

  describe 'GET /admin/companies/:company_id/products/new' do
    it 'loads without error and pre-selects company' do
      get "/admin/companies/#{company1.slug}/products/new"
      expect(response).to have_http_status(:success)
      expect(response.body).to include("selected=\"selected\" value=\"#{company1.id}\">#{company1.name}")
    end
  end
end
