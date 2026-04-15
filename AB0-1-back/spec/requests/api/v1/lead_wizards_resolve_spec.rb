require 'rails_helper'

RSpec.describe 'Lead wizards resolve API', type: :request do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria solar') }
  let(:other_category) { Category.create!(name: 'Mobilidade', description: 'Categoria EV') }

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

  it 'returns the company custom schema and availability metadata for the preferred company' do
    company = create_company(name: 'Empresa Solar', categories: [category])

    create_wizard_version!(
      scope: { category: category },
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

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id,
      preferred_company_id: company.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload['source']).to eq('company_custom')
    expect(payload.dig('availability', 'company_available')).to eq(true)
    expect(payload.dig('availability', 'reason')).to eq('company_available')
    expect(payload.dig('schema', 'steps', 0, 'fields', 0, 'key')).to eq('company_profile')
    expect(payload.dig('thank_you_config', 'title')).to eq('Obrigado pela empresa')
  end

  it 'returns explicit unavailability when the preferred company is outside the category' do
    company = create_company(name: 'Empresa EV', categories: [other_category])

    create_wizard_version!(
      scope: { category: category },
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

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id,
      preferred_company_id: company.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload['source']).to eq('category')
    expect(payload.dig('availability', 'company_available')).to eq(false)
    expect(payload.dig('availability', 'reason')).to eq('company_not_in_category')
    expect(payload.dig('schema', 'steps', 0, 'fields', 0, 'key')).to eq('roof_type')
  end

  it 'returns the global relational wizard before the built-in default' do
    create_wizard_version!(
      scope: {},
      template_key: 'global_wizard',
      thank_you_title: 'Obrigado pelo interesse global',
      field_key: 'global_interest',
      field_label: 'Interesse Geral',
      field_type: 'text',
      target: 'wizard_answers'
    )

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload['source']).to eq('default')
    expect(payload['template_key']).to eq('global_wizard')
    expect(payload['template_version']).to eq(2)
    expect(payload.dig('schema', 'steps', 0, 'fields', 0, 'key')).to eq('global_interest')
    expect(payload.dig('thank_you_config', 'title')).to eq('Obrigado pelo interesse global')
  end

  it 'falls back to the legacy category wizard when no relational version exists' do
    create_legacy_wizard!(
      category: category,
      template_key: 'legacy_solar',
      thank_you_title: 'Obrigado pelo legado',
      field_key: 'roof_type',
      field_label: 'Tipo de telhado'
    )

    get '/api/v1/lead_wizards/resolve', params: {
      category_id: category.id
    }

    expect(response).to have_http_status(:ok)

    payload = JSON.parse(response.body)
    expect(payload['source']).to eq('category')
    expect(payload['template_key']).to eq('legacy_solar')
    expect(payload['template_version']).to eq(7)
    expect(payload.dig('schema', 'steps', 0, 'fields', 0, 'key')).to eq('roof_type')
    expect(payload.dig('thank_you_config', 'title')).to eq('Obrigado pelo legado')
  end
end
