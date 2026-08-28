require 'rails_helper'

RSpec.describe 'Projects and materials domain', type: :model do
  describe CompanyProject do
    it 'keeps slugs unique within each company' do
      company = create(:company)
      create(:company_project, company: company, slug: 'usina-azul')

      duplicate = build(:company_project, company: company, slug: 'usina-azul')
      expect(duplicate).not_to be_valid
    end

    it 'publishes projects with a publication timestamp' do
      project = create(:company_project, status: 'draft')
      project.publish!

      expect(project.status).to eq('published')
      expect(project.published_at).to be_present
    end
  end

  describe CompanyMaterial do
    it 'requires a form for a gated material' do
      material = build(:company_material, gate_mode: 'form', content_lead_form: nil)

      expect(material).not_to be_valid
      expect(material.errors[:content_lead_form]).to be_present
    end

    it 'does not allow a form from another company' do
      material = build(:company_material, gate_mode: 'form')
      material.content_lead_form = create(:content_lead_form)

      expect(material).not_to be_valid
      expect(material.errors[:content_lead_form]).to be_present
    end
  end

  describe DigitalAsset do
    it 'rejects non-HTTPS external URLs' do
      asset = build(:digital_asset, external_url: 'http://unsafe.example/file')

      expect(asset).not_to be_valid
      expect(asset.errors[:external_url]).to be_present
    end

    it 'accepts a safe external video URL' do
      expect(build(:digital_asset)).to be_valid
    end

    it 'does not allow an asset to point to another company resource' do
      project = create(:company_project)
      asset = build(:digital_asset)
      asset.attachable = project
      asset.company = create(:company)

      expect(asset).not_to be_valid
      expect(asset.errors[:company]).to be_present
    end
  end

  describe ContentLead do
    it 'deduplicates email per company' do
      company = create(:company)
      create(:content_lead, company: company, email: 'lead@example.com')
      duplicate = build(:content_lead, company: company, email: 'lead@example.com')

      expect(duplicate).not_to be_valid
    end
  end

  describe ContentLeadForm do
    it 'requires a mandatory email field' do
      form = build(:content_lead_form, fields: [{ 'key' => 'name', 'label' => 'Nome', 'type' => 'text', 'required' => true }])

      expect(form).not_to be_valid
      expect(form.errors[:fields]).to be_present
    end

    it 'requires options when a field is a list' do
      form = build(:content_lead_form, fields: [
        { 'key' => 'email', 'label' => 'E-mail', 'type' => 'email', 'required' => true },
        { 'key' => 'segment', 'label' => 'Segmento', 'type' => 'select', 'required' => false, 'options' => [] }
      ])

      expect(form).not_to be_valid
      expect(form.errors[:fields]).to be_present
    end
  end

  describe MaterialDownload do
    it 'cannot be saved under a company different from its material' do
      material = create(:company_material)
      download = described_class.new(
        company: create(:company),
        company_material: material,
        authorization_token_digest: 'a' * 64,
        authorized_at: Time.current,
        expires_at: 15.minutes.from_now,
        delivery_status: 'authorized'
      )

      expect(download).not_to be_valid
      expect(download.errors[:company]).to be_present
    end
  end

  describe 'content feature flags' do
    it 'enables projects and intent analytics on Pro plans' do
      plan = create(:plan, name: 'Plano Pro Conteúdo', price: 299, features_json: {})
      company = create(:company, plan: plan)

      expect(company.feature_enabled?('projects_showcase')).to be(true)
      expect(company.feature_enabled?('content_intent_analytics')).to be(true)
    end
  end
end
