# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ReviewerBrandUsage, type: :model do
  describe 'validations' do
    subject { build(:reviewer_brand_usage) }

    it { is_expected.to validate_presence_of(:usage_context) }
    it { is_expected.to validate_presence_of(:source) }
    it { is_expected.to validate_presence_of(:visibility) }
    it { is_expected.to validate_presence_of(:verification_status) }
    it { is_expected.to validate_presence_of(:status) }

    it 'permite contextos de uso válidos' do
      ReviewerBrandUsage::USAGE_CONTEXTS.each do |context|
        expect(build(:reviewer_brand_usage, usage_context: context)).to be_valid
      end
    end

    it 'rejeita contexto de uso inválido' do
      expect(build(:reviewer_brand_usage, usage_context: 'invalid_context')).not_to be_valid
    end

    it 'permite fontes válidas' do
      ReviewerBrandUsage::SOURCES.each do |src|
        expect(build(:reviewer_brand_usage, source: src)).to be_valid
      end
    end

    it 'impede duplicidade de marca para o mesmo usuário no mesmo contexto' do
      user = create(:user)
      brand = create(:brand)
      create(:reviewer_brand_usage, user: user, brand: brand, usage_context: 'integrator_install')

      duplicate = build(:reviewer_brand_usage, user: user, brand: brand, usage_context: 'integrator_install')
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:brand_id]).to include('já cadastrado para este contexto de uso')
    end

    it 'permite a mesma marca para o mesmo usuário em contextos distintos' do
      user = create(:user)
      brand = create(:brand)
      create(:reviewer_brand_usage, user: user, brand: brand, usage_context: 'integrator_install')

      different_context = build(:reviewer_brand_usage, user: user, brand: brand, usage_context: 'personal_owner')
      expect(different_context).to be_valid
    end
  end

  describe 'consentimento e visibilidade pública' do
    it 'permite visibilidade privada sem consentimento preenchido' do
      usage = build(:reviewer_brand_usage, visibility: 'private', opted_in_at: nil, consent_version: nil)
      expect(usage).to be_valid
    end

    it 'rejeita visibilidade pública sem data de aceite' do
      usage = build(:reviewer_brand_usage, visibility: 'public', opted_in_at: nil, consent_version: 'v1.0')
      expect(usage).not_to be_valid
      expect(usage.errors[:visibility]).to include('requer consentimento explícito e versão dos termos para perfil público')
    end

    it 'rejeita visibilidade pública sem versão dos termos' do
      usage = build(:reviewer_brand_usage, visibility: 'public', opted_in_at: Time.current, consent_version: nil)
      expect(usage).not_to be_valid
      expect(usage.errors[:visibility]).to include('requer consentimento explícito e versão dos termos para perfil público')
    end

    it 'aceita visibilidade pública quando termos e data estão informados' do
      usage = build(:reviewer_brand_usage, :public)
      expect(usage).to be_valid
    end
  end

  describe 'validação temporal' do
    it 'rejeita data de início de experiência no futuro' do
      usage = build(:reviewer_brand_usage, experience_since: Date.current + 1.day)
      expect(usage).not_to be_valid
      expect(usage.errors[:experience_since]).to include('não pode ser uma data futura')
    end

    it 'aceita data de hoje ou no passado' do
      expect(build(:reviewer_brand_usage, experience_since: Date.current)).to be_valid
      expect(build(:reviewer_brand_usage, experience_since: 3.years.ago.to_date)).to be_valid
    end
  end

  describe 'métodos de ciclo de vida' do
    let(:usage) { create(:reviewer_brand_usage) }

    it '#opt_in_public! ativa visibilidade pública com consentimento' do
      usage.opt_in_public!(version: 'v2.1')
      expect(usage.visibility).to eq('public')
      expect(usage.consent_version).to eq('v2.1')
      expect(usage.opted_in_at).to be_present
    end

    it '#opt_out_public! reverte para privado' do
      public_usage = create(:reviewer_brand_usage, :public)
      public_usage.opt_out_public!
      expect(public_usage.visibility).to eq('private')
    end

    it '#soft_delete! desativa sem remover fisicamente' do
      usage.soft_delete!
      expect(usage.status).to eq('disabled')
    end

    it '#reactivate! reativa o registro' do
      disabled = create(:reviewer_brand_usage, :disabled)
      disabled.reactivate!
      expect(disabled.status).to eq('active')
    end
  end

  describe 'scopes' do
    let!(:active_private) { create(:reviewer_brand_usage, visibility: 'private', status: 'active') }
    let!(:active_public) { create(:reviewer_brand_usage, :public, status: 'active') }
    let!(:disabled_public) { create(:reviewer_brand_usage, :public, status: 'disabled') }
    let!(:verified_usage) { create(:reviewer_brand_usage, :verified, status: 'active') }

    it '.active filtra somente status active' do
      expect(described_class.active).to include(active_private, active_public, verified_usage)
      expect(described_class.active).not_to include(disabled_public)
    end

    it '.publicly_visible filtra somente ativos e públicos' do
      expect(described_class.publicly_visible).to include(active_public)
      expect(described_class.publicly_visible).not_to include(active_private, disabled_public)
    end

    it '.verified filtra somente verificados' do
      expect(described_class.verified).to include(verified_usage)
      expect(described_class.verified).not_to include(active_private)
    end
  end
end
