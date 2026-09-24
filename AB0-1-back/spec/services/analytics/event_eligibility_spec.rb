# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::EventEligibility do
  describe 'context: :acquisition' do
    it 'permite tráfego orgânico externo (Google)' do
      result = described_class.call({ referrer: 'https://www.google.com/search?q=solar' }, context: :acquisition)
      expect(result).to be_eligible
      expect(result.reason).to eq(:eligible)
    end

    it 'permite AI Referral (ChatGPT)' do
      result = described_class.call({ referrer: 'https://chatgpt.com' }, context: :acquisition)
      expect(result).to be_eligible
      expect(result.reason).to eq(:eligible)
    end

    it 'permite Direct e tráfego pago com UTM' do
      result_direct = described_class.call({}, context: :acquisition)
      expect(result_direct).to be_eligible

      result_utm = described_class.call({ utm_source: 'google', utm_medium: 'cpc' }, context: :acquisition)
      expect(result_utm).to be_eligible
    end

    it 'exclui atores internos (is_internal, is_employee, is_admin)' do
      expect(described_class.call({ is_internal: 'true' }, context: :acquisition)).not_to be_eligible
      expect(described_class.call({ is_employee: true }, context: :acquisition)).not_to be_eligible
      expect(described_class.call({ is_admin: 'true' }, context: :acquisition)).not_to be_eligible
    end

    it 'exclui superfícies técnicas (app, admin, auth, system)' do
      expect(described_class.call({ surface: 'app' }, context: :acquisition)).not_to be_eligible
      expect(described_class.call({ surface: 'admin' }, context: :acquisition)).not_to be_eligible
    end

    it 'exclui rotas técnicas (/auth, /dashboard, /logout, etc.)' do
      expect(described_class.call({ landing_path: '/auth/callback' }, context: :acquisition)).not_to be_eligible
      expect(described_class.call({ landing_path: '/dashboard' }, context: :acquisition)).not_to be_eligible
      expect(described_class.call({ landing_path: '/dashboard/analytics' }, context: :acquisition)).not_to be_eligible
    end

    it 'exclui referrer interno da aquisição comercial' do
      result = described_class.call({ referrer: 'https://avaliasolar.com.br' }, context: :acquisition)
      expect(result).not_to be_eligible
      expect(result.reason).to eq(:internal_referrer)

      result_crm = described_class.call({ referrer: 'https://crm.avaliasolar.com.br' }, context: :acquisition)
      expect(result_crm).not_to be_eligible
    end

    it 'exclui system/auth da aquisição comercial' do
      result = described_class.call({ referrer: 'https://accounts.google.com/oauth' }, context: :acquisition)
      expect(result).not_to be_eligible
      expect(result.reason).to eq(:system_auth)
    end
  end

  describe 'context: :organic_engagement' do
    it 'exclui funcionários, admins e atores internos' do
      expect(described_class.call({ is_internal: 'true' }, context: :organic_engagement)).not_to be_eligible
      expect(described_class.call({ is_employee: true }, context: :organic_engagement)).not_to be_eligible
      expect(described_class.call({ is_admin: 'true' }, context: :organic_engagement)).not_to be_eligible
    end

    it 'exclui superfícies técnicas' do
      expect(described_class.call({ surface: 'admin' }, context: :organic_engagement)).not_to be_eligible
      expect(described_class.call({ surface: 'app' }, context: :organic_engagement)).not_to be_eligible
    end

    it 'CRÍTICO: usuário público com referrer avaliasolar.com.br navegando no perfil É ELEGÍVEL para engajamento' do
      result = described_class.call({
        referrer: 'https://avaliasolar.com.br',
        landing_path: '/companies/weg',
        is_internal: false
      }, context: :organic_engagement)

      expect(result).to be_eligible
      expect(result.reason).to eq(:eligible)
    end
  end
end
