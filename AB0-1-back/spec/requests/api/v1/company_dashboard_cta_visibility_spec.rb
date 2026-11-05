require 'rails_helper'

RSpec.describe 'Company Dashboard CTA visibility', type: :request do
  let(:user) { create(:user, status: :active, role: :company) }
  let(:company) { create(:company, status: :active) }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before { create(:company_member, user: user, company: company, role: 'owner') }

  it 'updates the quote preference without mutating WhatsApp preference or creating a pending change' do
    original_whatsapp = company.whatsapp_enabled
    expect {
      patch '/api/v1/company_dashboard/cta_visibility',
            params: { company_id: company.id, quote_cta_enabled: false },
            headers: headers
    }.not_to change(PendingChange, :count)

    expect(response).to have_http_status(:ok)
    expect(company.reload.quote_cta_enabled).to eq(false)
    expect(company.whatsapp_enabled).to eq(original_whatsapp)
    expect(JSON.parse(response.body)['quote_cta_enabled']).to eq(false)
  end

  it 'keeps quote enabled when the WhatsApp preference is disabled' do
    company.update!(quote_cta_enabled: true)
    patch '/api/v1/company_dashboard/cta_visibility',
          params: { company_id: company.id, whatsapp_enabled: false },
          headers: headers
    expect(response).to have_http_status(:ok)
    expect(company.reload.quote_cta_enabled).to eq(true)
    expect(company.whatsapp_enabled).to eq(false)
  end

  it 'rejects nonboolean values without modifying the company' do
    patch '/api/v1/company_dashboard/cta_visibility',
          params: { company_id: company.id, quote_cta_enabled: 'whatever' },
          headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
    expect(company.reload.quote_cta_enabled).to eq(true)
  end

  it 'does not allow changes to another company without authorized membership' do
    foreign = create(:company, status: :active)
    patch '/api/v1/company_dashboard/cta_visibility',
          params: { company_id: foreign.id, quote_cta_enabled: false },
          headers: headers
    expect(response).not_to have_http_status(:ok)
    expect(foreign.reload.quote_cta_enabled).to eq(true)
  end
end
