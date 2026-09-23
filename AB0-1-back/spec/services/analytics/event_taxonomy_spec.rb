require 'rails_helper'

RSpec.describe Analytics::EventTaxonomy do
  it 'normaliza aliases de perfil e CTA' do
    expect(described_class.canonical('company_profile_viewed')).to eq('profile_view')
    expect(described_class.canonical('company_cta_clicked')).to eq('cta_click')
    expect(described_class.cta_type('company_cta_whatsapp', {})).to eq('whatsapp')
    expect(described_class.cta_type('Quote Request CTA Clicked', {})).to eq('quote')
  end

  it 'não trata CTA de orçamento como lead' do
    expect(described_class.canonical('Quote Request CTA Clicked')).to eq('cta_click')
  end
end
