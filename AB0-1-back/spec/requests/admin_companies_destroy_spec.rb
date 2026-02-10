require 'rails_helper'

RSpec.describe 'Admin Companies Destroy', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin-destroy@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  before do
    sign_in admin_user
  end

  describe 'DELETE /admin/companies/:id' do
    it 'deletes company by slug and nullifies direct dependencies' do
      company = create(:company, slug: 'empresa-para-excluir')
      linked_user = create(:user, company: company, email: 'linked-user@example.com')
      banner = Banner.new(
        title: 'Banner teste',
        link: 'https://example.com',
        position: 'companies_top',
        banner_type: 'rectangular_large',
        width: 960,
        height: 100,
        moderation_status: 'draft',
        active: false
      )
      banner.save!(validate: false)
      banner_event = BannerEvent.create!(banner: banner, company: company, event_type: 'view', tracked_at: Time.current)

      expect do
        delete admin_company_path(company.slug)
      end.to change(Company, :count).by(-1)

      expect(response).to redirect_to(admin_companies_path)
      expect(flash[:notice]).to eq('Empresa excluida com sucesso.')
      expect(linked_user.reload.company_id).to be_nil
      expect(banner_event.reload.company_id).to be_nil
    end

    it 'returns a friendly message when company does not exist' do
      delete admin_company_path('empresa-inexistente')

      expect(response).to redirect_to(admin_companies_path)
      expect(flash[:alert]).to eq('Empresa nao encontrada.')
    end

    it 'returns a friendly message when destroy raises invalid foreign key' do
      company = create(:company, slug: 'empresa-fk')
      allow_any_instance_of(Company).to receive(:destroy).and_raise(ActiveRecord::InvalidForeignKey, 'fk')

      delete admin_company_path(company.slug)

      expect(response).to redirect_to(admin_companies_path)
      expect(flash[:alert]).to eq('Nao foi possivel excluir a empresa porque existem registros vinculados.')
      expect(Company.exists?(company.id)).to be(true)
    end
  end
end
