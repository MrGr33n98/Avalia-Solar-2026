require 'rails_helper'

RSpec.describe 'Admin Lead Wizard Versions', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin-lead-wizard@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let!(:category) { Category.create!(name: 'Solar', description: 'Categoria solar') }

  before do
    LeadWizardVersion.destroy_all
    sign_in admin_user
  end

  def create_published_version
    version = create_draft_version
    version.lead_wizard_sections.first.lead_wizard_fields.first.update!(required: true)
    version.update!(status: 'published')
    version
  end

  def create_draft_version
    version = LeadWizardVersion.create!(
      category: category,
      template_key: 'solar_category',
      template_version: 2,
      version_number: nil,
      status: 'draft',
      ui_theme: 'auto',
      thank_you_title: 'Obrigado'
    )

    section = version.lead_wizard_sections.create!(
      key: 'contact_info',
      title: 'Seus Dados',
      position: 0
    )

    field = section.lead_wizard_fields.build(
      key: 'email',
      field_type: 'email',
      label: 'E-mail',
      target: 'lead',
      required: true,
      position: 0
    )
    field.save!
    version
  end

  describe 'GET /admin/lead_wizard_versions' do
    it 'loads the index without errors' do
      get '/admin/lead_wizard_versions'

      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST /admin/lead_wizard_versions' do
    it 'creates a draft lead wizard version' do
      expect do
        post '/admin/lead_wizard_versions', params: {
          lead_wizard_version: {
            category_id: category.id,
            template_key: 'solar_category',
            template_version: 1,
            status: 'draft',
            ui_theme: 'auto',
            show_progress_bar: '1',
            thank_you_title: 'Obrigado'
          }
        }
      end.to change(LeadWizardVersion, :count).by(1)

      version = LeadWizardVersion.order(:id).last
      expect(response).to redirect_to(admin_lead_wizard_version_path(version))
      expect(version.category).to eq(category)
      expect(version.status).to eq('draft')
    end

    it 'creates a global draft lead wizard version when no scope is selected' do
      expect do
        post '/admin/lead_wizard_versions', params: {
          lead_wizard_version: {
            template_key: 'global_wizard',
            template_version: 1,
            status: 'draft',
            ui_theme: 'auto',
            show_progress_bar: '1',
            thank_you_title: 'Obrigado'
          }
        }
      end.to change(LeadWizardVersion, :count).by(1)

      version = LeadWizardVersion.order(:id).last
      expect(response).to redirect_to(admin_lead_wizard_version_path(version))
      expect(version.company).to be_nil
      expect(version.category).to be_nil
      expect(version.scope_kind).to eq('global')
    end
  end

  describe 'PUT /admin/lead_wizard_versions/:id/publish' do
    it 'publishes a version with structure' do
      version = create_published_version

      put publish_admin_lead_wizard_version_path(version)

      expect(response).to redirect_to(admin_lead_wizard_version_path(version))
      expect(version.reload).to be_published
    end

    it 'archives the previous published version in the same scope' do
      previous = create_published_version
      next_version = create_draft_version
      next_version.update!(template_key: 'solar_category_v2', template_version: 3)

      put publish_admin_lead_wizard_version_path(next_version)

      expect(response).to redirect_to(admin_lead_wizard_version_path(next_version))
      expect(next_version.reload).to be_published
      expect(previous.reload).to be_archived
    end
  end

  describe 'POST /admin/lead_wizard_versions/:id/clone_draft' do
    it 'creates a draft clone' do
      version = create_published_version

      expect do
        post clone_draft_admin_lead_wizard_version_path(version)
      end.to change(LeadWizardVersion, :count).by(1)

      cloned_version = LeadWizardVersion.order(:id).last
      expect(response).to redirect_to(edit_admin_lead_wizard_version_path(cloned_version))
      expect(cloned_version.status).to eq('draft')
      expect(cloned_version.version_number).to eq(version.version_number + 1)
      expect(cloned_version.category).to eq(version.category)
      expect(cloned_version.lead_wizard_sections.first.lead_wizard_fields.first.key).to eq('email')
    end
  end
end
