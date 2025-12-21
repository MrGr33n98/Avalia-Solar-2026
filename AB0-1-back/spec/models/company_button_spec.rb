require 'rails_helper'

RSpec.describe CompanyButton, type: :model do
  let(:company) { create(:company) }

  it 'rejeita esquemas perigosos' do
    button = described_class.new(
      company: company,
      label: 'Clique',
      url: 'javascript:alert(1)',
      button_type: 'custom'
    )

    expect(button).not_to be_valid
    expect(button.errors[:url]).to be_present
  end
end
