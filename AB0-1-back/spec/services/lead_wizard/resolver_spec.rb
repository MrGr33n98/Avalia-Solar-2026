require 'rails_helper'

RSpec.describe LeadWizard::Resolver do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:solar_category) { Category.create!(name: 'Solar', description: 'Categoria solar') }
  let(:ev_category) { Category.create!(name: 'Mobilidade', description: 'Categoria de mobilidade') }

  def create_company(name:, categories:)
    base_attrs = {
      name: name,
      description: 'Descricao da empresa',
      email: "#{name.parameterize}@empresa.com",
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      status: 'active',
      verified: true,
      featured: false,
      active_admin: true,
      cnpj: '12345678901234'
    }
    base_attrs[:plan_status] = 'active' if Company.column_names.include?('plan_status')

    company = Company.new(base_attrs)
    company.categories = categories
    company.save!
    company
  end

  def create_wizard_version!(scope:, template_key:, thank_you_title:, field_key:, field_label:, field_type: 'text', target: 'lead', options: [])
    version = LeadWizardVersion.create!(
      company: scope[:company],
      category: scope[:category],
      template_key: template_key,
      template_version: 2,
      status: 'draft',
      ui_theme: 'auto',
      show_progress_bar: true,
      thank_you_title: thank_you_title
    )

    section = version.lead_wizard_sections.create!(
      key: 'contact_info',
      title: 'Seus Dados',
      position: 0
    )

    field = section.lead_wizard_fields.build(
      key: field_key,
      field_type: field_type,
      label: field_label,
      target: target,
      required: true,
      position: 0
    )

    options.each_with_index do |option, index|
      field.lead_wizard_field_options.build(
        label: option[:label],
        value: option[:value],
        position: index
      )
    end

    field.save!
    version.update!(status: 'published')
    version
  end

  def create_legacy_wizard!(category:, template_key:, thank_you_title:, field_key:, field_label:)
    CategoryLeadWizard.create!(
      category: category,
      enabled: true,
      template_key: template_key,
      template_version: 7,
      schema: {
        steps: [
          {
            id: 'legacy_contact',
            title: 'Contato',
            fields: [
              {
                key: field_key,
                type: 'text',
                label: field_label,
                required: true
              }
            ]
          }
        ]
      },
      thank_you_config: {
        title: thank_you_title
      }
    )
  end

  it 'returns the company custom wizard when the preferred company is available' do
    company = create_company(name: 'Empresa Solar', categories: [solar_category])

    create_wizard_version!(
      scope: { category: solar_category },
      template_key: 'solar_category',
      thank_you_title: 'Obrigado pela categoria',
      field_key: 'roof_type',
      field_label: 'Telhado',
      field_type: 'select',
      target: 'wizard_answers',
      options: [
        { label: 'Fibrocimento', value: 'fibrocimento' },
        { label: 'Cerâmica', value: 'ceramica' }
      ]
    )

    create_wizard_version!(
      scope: { company: company },
      template_key: 'solar_company',
      thank_you_title: 'Obrigado pela empresa',
      field_key: 'company_profile',
      field_label: 'Perfil da Empresa',
      field_type: 'text',
      target: 'lead'
    )

    result = described_class.resolve(category_id: solar_category.id, preferred_company_id: company.id)

    expect(result[:source]).to eq('company_custom')
    expect(result.dig(:availability, :company_available)).to eq(true)
    expect(result.dig(:availability, :reason)).to eq('company_available')
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('company_profile')
    expect(result[:schema][:steps].first[:fields].first[:target]).to eq('lead')
    expect(result[:thank_you_config][:title]).to eq('Obrigado pela empresa')
  end

  it 'falls back to the category wizard when the preferred company is outside the category' do
    company = create_company(name: 'Empresa EV', categories: [ev_category])

    create_wizard_version!(
      scope: { category: solar_category },
      template_key: 'solar_category',
      thank_you_title: 'Obrigado pela categoria',
      field_key: 'roof_type',
      field_label: 'Telhado',
      field_type: 'select',
      target: 'wizard_answers',
      options: [
        { label: 'Fibrocimento', value: 'fibrocimento' },
        { label: 'Cerâmica', value: 'ceramica' }
      ]
    )

    result = described_class.resolve(category_id: solar_category.id, preferred_company_id: company.id)

    expect(result[:source]).to eq('category')
    expect(result.dig(:availability, :company_available)).to eq(false)
    expect(result.dig(:availability, :reason)).to eq('company_not_in_category')
    expect(result.dig(:availability, :message)).to be_present
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('roof_type')
    expect(result[:thank_you_config][:title]).to eq('Obrigado pela categoria')
  end

  it 'falls back to the global default when no scoped wizard exists' do
    result = described_class.resolve(category_id: solar_category.id)

    expect(result[:source]).to eq('default')
    expect(result[:template_key]).to eq('solar')
    expect(result[:template_version]).to eq(1)
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('full_name')
    expect(result[:thank_you_config]).to eq({})
  end

  it 'uses the global relational wizard before the built-in default' do
    create_wizard_version!(
      scope: {},
      template_key: 'global_wizard',
      thank_you_title: 'Obrigado pelo interesse global',
      field_key: 'global_interest',
      field_label: 'Interesse Geral',
      field_type: 'text',
      target: 'wizard_answers'
    )

    result = described_class.resolve(category_id: solar_category.id)

    expect(result[:source]).to eq('default')
    expect(result[:template_key]).to eq('global_wizard')
    expect(result[:template_version]).to eq(2)
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('global_interest')
    expect(result[:thank_you_config][:title]).to eq('Obrigado pelo interesse global')
  end

  it 'falls back to the legacy category wizard when no relational version exists' do
    create_legacy_wizard!(
      category: solar_category,
      template_key: 'legacy_solar',
      thank_you_title: 'Obrigado pelo legado',
      field_key: 'roof_type',
      field_label: 'Tipo de telhado'
    )

    result = described_class.resolve(category_id: solar_category.id)

    expect(result[:source]).to eq('category')
    expect(result[:template_key]).to eq('legacy_solar')
    expect(result[:template_version]).to eq(7)
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('roof_type')
    expect(result[:thank_you_config][:title]).to eq('Obrigado pelo legado')
  end

  it 'prefers the global relational wizard over legacy JSON fallback' do
    create_wizard_version!(
      scope: {},
      template_key: 'global_wizard',
      thank_you_title: 'Obrigado pelo interesse global',
      field_key: 'global_interest',
      field_label: 'Interesse Geral',
      field_type: 'text',
      target: 'wizard_answers'
    )

    create_legacy_wizard!(
      category: solar_category,
      template_key: 'legacy_solar',
      thank_you_title: 'Obrigado pelo legado',
      field_key: 'roof_type',
      field_label: 'Tipo de telhado'
    )

    result = described_class.resolve(category_id: solar_category.id)

    expect(result[:source]).to eq('default')
    expect(result[:template_key]).to eq('global_wizard')
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('global_interest')
  end
end
