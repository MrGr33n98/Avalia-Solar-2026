# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyProfileView, type: :model do
  describe '.bot_user_agent?' do
    subject(:bot?) { described_class.bot_user_agent?(user_agent) }

    context 'com agente vazio' do
      let(:user_agent) { '' }
      it { is_expected.to be true }
    end

    context 'com agente nil' do
      let(:user_agent) { nil }
      it { is_expected.to be true }
    end

    context 'com Googlebot' do
      let(:user_agent) { 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
      it { is_expected.to be true }
    end

    context 'com Bingbot' do
      let(:user_agent) { 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' }
      it { is_expected.to be true }
    end

    context 'com navegador real (Chrome)' do
      let(:user_agent) do
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      end
      it { is_expected.to be false }
    end

    context 'com Safari mobile' do
      let(:user_agent) do
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      end
      it { is_expected.to be false }
    end
  end

  describe '.hash_value' do
    it 'retorna nil para valor em branco' do
      expect(described_class.hash_value(nil)).to be_nil
      expect(described_class.hash_value('')).to be_nil
    end

    it 'retorna string de 64 caracteres' do
      result = described_class.hash_value('192.168.0.1')
      expect(result).to be_a(String)
      expect(result.length).to eq(64)
    end

    it 'é determinístico para o mesmo input' do
      expect(described_class.hash_value('1.2.3.4')).to eq(described_class.hash_value('1.2.3.4'))
    end

    it 'é diferente para inputs distintos' do
      expect(described_class.hash_value('1.2.3.4')).not_to eq(described_class.hash_value('5.6.7.8'))
    end
  end

  describe 'validations' do
    let(:company) { create(:company) }

    it 'é válido com atributos corretos' do
      view = build(:company_profile_view, company: company)
      expect(view).to be_valid
    end

    it 'é inválido sem session_fingerprint' do
      view = build(:company_profile_view, company: company, session_fingerprint: nil)
      expect(view).not_to be_valid
    end

    it 'é inválido sem ip_hash' do
      view = build(:company_profile_view, company: company, ip_hash: nil)
      expect(view).not_to be_valid
    end
  end

  describe 'scopes' do
    let(:company) { create(:company) }

    it '.recent_24h exclui registros mais antigos que 24h' do
      old_view = create(:company_profile_view, company: company, viewed_at: 25.hours.ago)
      recent   = create(:company_profile_view, company: company, viewed_at: 1.hour.ago,
                                               session_fingerprint: 'abc2', ip_hash: 'abc2')

      expect(described_class.recent_24h).to     include(recent)
      expect(described_class.recent_24h).not_to include(old_view)
    end

    it '.for_company filtra por empresa' do
      other_company = create(:company)
      view_mine  = create(:company_profile_view, company: company)
      view_other = create(:company_profile_view, company: other_company,
                                                 session_fingerprint: 'xyz', ip_hash: 'xyz')

      expect(described_class.for_company(company.id)).to     include(view_mine)
      expect(described_class.for_company(company.id)).not_to include(view_other)
    end
  end
end
