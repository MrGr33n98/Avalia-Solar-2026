# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingReadinessService do
  let(:company) do
    create(
      :company,
      name: 'Solar Teste',
      state: 'SC',
      city: 'Florianópolis',
      verified: true,
      whatsapp_enabled: true,
      cta_whatsapp_enabled: true,
      social_proof_enabled: true,
      reviews_count: 5,
      leads_count: 3
    )
  end

  subject(:service) { described_class.new(company: company) }

  describe '#call' do
    it 'returns all 6 steps completed when company has full operational readiness' do
      create(:company_service_area, company: company, coverage_type: 'city', state_code: 'SC', city_name: 'Florianópolis', is_active: true)

      result = service.call

      expect(result[:total_steps]).to eq(6)
      expect(result[:completed_steps]).to eq(6)
      expect(result[:completion_percentage]).to eq(100)
      expect(result[:is_eligible]).to be(true)
      expect(result[:next_action]).to be_nil
    end

    it 'detects pending steps and identifies next action' do
      company.update!(verified: false)

      result = service.call

      expect(result[:completed_steps]).to be < 6
      expect(result[:is_eligible]).to be(false)
      expect(result[:next_action]).to be_present
      expect(result[:next_action][:step_id]).to eq('coverage').or eq('verification')
    end
  end
end
