require 'rails_helper'

RSpec.describe 'Admin Company 360 materials', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }
  let!(:material) { create(:company_material, company: company, status: 'pending') }
  let!(:other_material) { create(:company_material, company: other_company, title: 'Fora da empresa') }

  before { sign_in admin_user }

  it 'exibe apenas materiais da empresa e status em português' do
    get materials_admin_company_path(company)

    expect(response).to have_http_status(:success)
    expect(response.body).to include(material.title, 'Em análise')
    expect(response.body).not_to include(other_material.title)
  end

  it 'mantém resource global disponível' do
    get admin_company_materials_path

    expect(response).to have_http_status(:success)
  end
end

RSpec.describe 'Admin CompanyMaterial form', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end
  let!(:material) { create(:company_material, status: 'pending') }

  before { sign_in admin_user }

  it 'renderiza status como select e não oferece publicação manual' do
    get edit_admin_company_material_path(material)

    expect(response).to have_http_status(:success)
    expect(response.body).to include('company_material_status')
    expect(response.body).to include('Em análise')
    expect(response.body).not_to include('<option value="published"')
  end
end

RSpec.describe 'Admin CompanyMaterial moderation guard', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end
  let!(:material) { create(:company_material, status: 'pending') }

  before { sign_in admin_user }

  it 'bloqueia publicação por edição manual' do
    patch admin_company_material_path(material), params: { company_material: { status: 'published' } }

    expect(response).to redirect_to(admin_company_material_path(material))
    expect(material.reload.status).to eq('pending')
  end
end
