require 'rails_helper'

RSpec.describe 'WhatsApp paid profile contact', type: :model do
  let(:paid_plan) { create(:plan, name: 'Plano Essencial', price: 99, features_json: { custom_ctas: false }) }
  let(:free_plan) { create(:plan, name: 'Gratuito', price: 0, features_json: { custom_ctas: true }) }

  it 'shows a valid direct link for Essencial without depending on quote CTAs' do
    company = create(:company, plan: paid_plan, whatsapp: '48999700506', whatsapp_enabled: true)
    expect(company.whatsapp_contact_button_entitled?).to be(true)
    expect(company.whatsapp_contact_url).to eq('https://wa.me/5548999700506')
  end

  it 'does not show the button on Free even when configured' do
    company = create(:company, plan: free_plan, whatsapp: '48999700506', whatsapp_enabled: true)
    expect(company.whatsapp_contact_button_enabled?).to be(false)
    expect(company.whatsapp_contact_url).to be_nil
  end

  it "honors the company's WhatsApp opt-out" do
    company = create(:company, plan: paid_plan, whatsapp: '48999700506', whatsapp_enabled: false)
    expect(company.whatsapp_contact_button_entitled?).to be(true)
    expect(company.whatsapp_contact_url).to be_nil
  end

  it 'updates the link when the number changes' do
    company = create(:company, plan: paid_plan, whatsapp: '48999700506', whatsapp_enabled: true)
    company.update!(whatsapp: '48996418578')
    expect(company.whatsapp_contact_url).to eq('https://wa.me/5548996418578')
    expect(company.whatsapp_url).to eq('https://wa.me/5548996418578')
  end

  it 'hides the button when the paid plan expires' do
    company = create(:company, plan: paid_plan, plan_status: 'active', whatsapp: '48999700506', whatsapp_enabled: true)
    company.update!(plan_status: 'expired')
    expect(company.whatsapp_contact_button_enabled?).to be(false)
  end
end
