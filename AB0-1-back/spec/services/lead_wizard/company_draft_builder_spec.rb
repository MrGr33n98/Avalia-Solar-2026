require 'rails_helper'

RSpec.describe 'LeadWizard::CompanyDraftBuilder' do
  # P3.1 audit: implementation is absent in current tree. Keep contract visible
  # without making suite fail before service exists.
  it 'builds draft with company scope and draft status', :pending do
    skip 'LeadWizard::CompanyDraftBuilder ainda não existe'

    company = create(:company)
    draft = described_class.call(company)

    expect(draft).to be_a(LeadWizardVersion)
    expect(draft.company).to eq(company)
    expect(draft).to be_draft
  end

  it 'copies published structure including options without publishing clone', :pending do
    skip 'LeadWizard::CompanyDraftBuilder ainda não existe'

    company = create(:company)
    published = LeadWizardVersion.create!(
      company: company,
      template_key: 'solar_company',
      template_version: 1,
      status: 'published'
    )
    section = published.lead_wizard_sections.create!(key: 'contact', title: 'Contato', position: 0)
    field = section.lead_wizard_fields.create!(
      key: 'name', field_type: 'text', label: 'Nome', target: 'lead', position: 0, required: true
    )
    field.lead_wizard_field_options.create!(label: 'Pessoa', value: 'person', position: 0)

    draft = described_class.call(company, source: published)

    expect(draft).to be_draft
    expect(draft.lead_wizard_sections.first.key).to eq('contact')
    expect(draft.lead_wizard_fields.first.key).to eq('name')
    expect(draft.lead_wizard_field_options.first.value).to eq('person')
  end
end
