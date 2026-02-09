require 'rails_helper'
require 'tempfile'

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
    it 'loads edit page without errors for company without members' do
      get edit_admin_company_path(company)
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Membros da Empresa')
    end

    it 'loads edit page without errors for company with members' do
      create(:company_member, company: company, user: user_member, role: :owner)

      get edit_admin_company_path(company)
      expect(response).to have_http_status(:success)
      expect(response.body).to include('Membros da Empresa')
      expect(response.body).to include(user_member.name)
    end
  end

  describe 'PATCH /admin/companies/:id' do
    it 'allows adding a member via nested form' do
      patch admin_company_path(company), params: {
        company: {
          company_members_attributes: {
            '0' => {
              user_id: user_member.id,
              role: 'owner'
            }
          }
        }
      }

      expect(response).to redirect_to(admin_company_path(company))
      expect(company.company_members.count).to eq(1)
      expect(company.company_members.first.user_id).to eq(user_member.id)
    end

    it 'uploads logo, banner and media assets successfully' do
      logo_file = Tempfile.new(['logo', '.svg'])
      banner_file = Tempfile.new(['banner', '.svg'])
      media_file = Tempfile.new(['media', '.svg'])
      svg_content = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400"/></svg>'

      [logo_file, banner_file, media_file].each do |file|
        file.binmode
        file.write(svg_content)
        file.rewind
      end

      patch admin_company_path(company), params: {
        company: {
          logo: Rack::Test::UploadedFile.new(logo_file.path, 'image/svg+xml'),
          banner: Rack::Test::UploadedFile.new(banner_file.path, 'image/svg+xml'),
          media_assets: [Rack::Test::UploadedFile.new(media_file.path, 'image/svg+xml')]
        }
      }

      expect(response).to redirect_to(admin_company_path(company))
      company.reload
      expect(company.logo).to be_attached
      expect(company.banner).to be_attached
      expect(company.media_assets).to be_attached
    ensure
      [logo_file, banner_file, media_file].each do |file|
        file&.close
        file&.unlink
      end
    end
  end
end
