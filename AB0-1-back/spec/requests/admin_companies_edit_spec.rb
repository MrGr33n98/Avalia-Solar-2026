require 'rails_helper'

RSpec.describe 'Admin Companies Edit', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let!(:plan) { create(:plan) }
  let!(:company) { create(:company, plan: plan, slug: 'test-company') }
  let!(:user_member) { create(:user, role: 'company') }

  before do
    sign_in admin_user
  end

  describe 'GET /admin/companies/:id/edit' do
    it 'carrega a página de edição sem erros para uma empresa sem membros' do
      get edit_admin_company_path(company)
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Membros da Empresa')
    end

    it 'carrega a página de edição sem erros para uma empresa com membros' do
      create(:company_member, company: company, user: user_member, role: :owner)
      
      get edit_admin_company_path(company)
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Membros da Empresa')
      expect(response.body).to include(user_member.name)
    end
  end

  describe 'PATCH /admin/companies/:id' do
    it 'permite adicionar um membro via formulário aninhado' do
      patch admin_company_path(company), params: {
        company: {
          company_members_attributes: {
            "0" => {
              user_id: user_member.id,
              role: "owner"
            }
          }
        }
      }

      expect(response).to redirect_to(admin_company_path(company))
      expect(company.company_members.count).to eq(1)
      expect(company.company_members.first.user_id).to eq(user_member.id)
    end
  end
end
