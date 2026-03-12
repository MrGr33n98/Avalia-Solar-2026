require 'rails_helper'

RSpec.describe 'Admin SaaS Leads', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let!(:b2b_category) do
    create(
      :category,
      name: 'Condominios Comerciais',
      permissions_config: { lead_profile: { audience: 'b2b' } }
    )
  end

  let!(:b2c_category) do
    create(
      :category,
      name: 'Residencial',
      permissions_config: { lead_profile: { audience: 'b2c' } }
    )
  end

  let!(:b2b_lead) do
    create(
      :lead,
      category: b2b_category,
      email: 'b2b@example.com',
      wizard_status: 'verified',
      otp_verified_at: Time.current,
      estimated_budget: 'R$ 90.000',
      decision_timeline: '3_months',
      project_profile: 'commercial'
    )
  end

  let!(:b2c_lead) do
    create(
      :lead,
      category: b2c_category,
      email: 'b2c@example.com',
      wizard_status: 'draft'
    )
  end

  before do
    sign_in admin_user
  end

  it 'loads the SaaS Leads index with expected columns' do
    get admin_saas_leads_path

    expect(response).to have_http_status(:success)
    expect(response.body).to include('SaaS Leads')
    expect(response.body).to include('Score')
    expect(response.body).to include('Usuario B2B')
    expect(response.body).to include('Distribuido')
    expect(response.body).to include('Conversao em')
    expect(response.body).to include('b2b@example.com')
    expect(response.body).to include('b2c@example.com')
  end

  it 'filters by B2B scope' do
    get admin_saas_leads_path, params: { scope: 'b2b' }

    expect(response).to have_http_status(:success)
    expect(response.body).to include('b2b@example.com')
    expect(response.body).not_to include('b2c@example.com')
  end
end
