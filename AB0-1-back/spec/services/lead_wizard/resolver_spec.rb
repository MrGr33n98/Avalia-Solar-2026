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

  it 'returns normalized schema and availability for an associated preferred company' do
    company = create_company(name: 'Empresa Solar', categories: [solar_category])
    CategoryLeadWizard.create!(
      category: solar_category,
      template_key: 'solar_residential',
      template_version: 2,
      schema: {
        'steps' => [
          {
            'id' => 'step_1',
            'fields' => [
              { 'key' => 'roof_type', 'type' => 'select', 'label' => 'Telhado' }
            ]
          }
        ]
      },
      thank_you_config: {
        'title' => 'Obrigado'
      }
    )

    result = described_class.resolve(category_id: solar_category.id, preferred_company_id: company.id)

    expect(result[:source]).to eq('category')
    expect(result.dig(:availability, :company_available)).to eq(true)
    expect(result.dig(:availability, :reason)).to eq('company_available')
    expect(result[:schema][:steps].first[:fields].first[:key]).to eq('roof_type')
    expect(result[:thank_you_config][:title]).to eq('Obrigado')
  end

  it 'flags the preferred company as unavailable when it is not associated to the category' do
    company = create_company(name: 'Empresa EV', categories: [ev_category])

    result = described_class.resolve(category_id: solar_category.id, preferred_company_id: company.id)

    expect(result[:source]).to eq('default')
    expect(result.dig(:availability, :company_available)).to eq(false)
    expect(result.dig(:availability, :reason)).to eq('company_not_in_category')
    expect(result.dig(:availability, :message)).to be_present
  end
end
