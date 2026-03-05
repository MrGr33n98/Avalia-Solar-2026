require 'rails_helper'

RSpec.describe CategoryLeadWizard, type: :model do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria solar') }

  it 'parses schema and thank_you_config from JSON strings' do
    wizard = described_class.new(
      category: category,
      template_key: 'solar_financing',
      schema: '{"steps":[{"id":"contact","fields":[]}]}',
      thank_you_config: '{"title":"Obrigado"}'
    )

    expect(wizard).to be_valid
    expect(wizard.schema).to eq(
      'steps' => [
        { 'id' => 'contact', 'fields' => [] }
      ]
    )
    expect(wizard.thank_you_config).to eq('title' => 'Obrigado')
  end

  it 'rejects invalid schema JSON strings' do
    wizard = described_class.new(
      category: category,
      template_key: 'solar_financing',
      schema: '{"steps":['
    )

    expect(wizard).not_to be_valid
    expect(wizard.errors[:schema]).to include('must be a valid JSON object')
  end

  it 'rejects non-object thank_you_config JSON values' do
    wizard = described_class.new(
      category: category,
      template_key: 'solar_financing',
      schema: { 'steps' => [] },
      thank_you_config: '[]'
    )

    expect(wizard).not_to be_valid
    expect(wizard.errors[:thank_you_config]).to include('must be a valid JSON object')
  end
end
