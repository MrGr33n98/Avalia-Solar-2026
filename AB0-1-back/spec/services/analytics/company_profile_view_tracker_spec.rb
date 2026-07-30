# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::CompanyProfileViewTracker, type: :service do
  let(:company)      { create(:company) }
  let(:chrome_ua)    { 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
  let(:bot_ua)       { 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }

  def build_request(ip: '10.0.0.1', ua: chrome_ua, referer: nil)
    instance_double(ActionDispatch::Request,
                    remote_ip:  ip,
                    user_agent: ua,
                    referer:    referer)
  end

  describe '.track' do
    context 'com bot User-Agent' do
      it 'não registra a visualização' do
        req = build_request(ua: bot_ua)
        result = described_class.track(company_id: company.id, request: req)
        expect(result.tracked).to be false
        expect(result.reason).to  eq('bot_user_agent')
        expect(CompanyProfileView.count).to eq(0)
      end
    end

    context 'com owner logado' do
      let(:owner_user) { create(:user) }

      before do
        create(:company_member, company: company, user: owner_user, role: 'owner')
      end

      it 'não registra a visualização' do
        req    = build_request
        result = described_class.track(company_id: company.id, request: req, current_user: owner_user)
        expect(result.tracked).to be false
        expect(result.reason).to  eq('owner_or_collaborator')
        expect(CompanyProfileView.count).to eq(0)
      end
    end

    context 'com visitante válido' do
      it 'registra a visualização com sucesso' do
        req    = build_request
        result = described_class.track(company_id: company.id, request: req)
        expect(result.tracked).to be true
        expect(result.reason).to  eq('ok')
        expect(CompanyProfileView.count).to eq(1)
      end

      it 'não registra duplicata do mesmo fingerprint nas últimas 24h' do
        req = build_request
        described_class.track(company_id: company.id, request: req)
        result = described_class.track(company_id: company.id, request: req)

        expect(result.tracked).to be false
        expect(result.reason).to  eq('duplicate_fingerprint_24h')
        expect(CompanyProfileView.count).to eq(1)
      end

      it 'permite nova visualização após 24h' do
        req = build_request
        # Simula registro antigo (> 24h)
        CompanyProfileView.create!(
          company_id:          company.id,
          session_fingerprint: CompanyProfileView.hash_value("#{CompanyProfileView.hash_value('10.0.0.1')}-#{CompanyProfileView.hash_value(chrome_ua)}-#{company.id}"),
          ip_hash:             CompanyProfileView.hash_value('10.0.0.1'),
          user_agent_hash:     CompanyProfileView.hash_value(chrome_ua),
          viewed_at:           25.hours.ago
        )

        result = described_class.track(company_id: company.id, request: req)
        expect(result.tracked).to be true
        expect(CompanyProfileView.count).to eq(2)
      end

      it 'invalida o cache Redis após inserção' do
        Rails.cache.write("company_profile_views:#{company.id}", 99)
        described_class.track(company_id: company.id, request: build_request)
        expect(Rails.cache.read("company_profile_views:#{company.id}")).to be_nil
      end
    end
  end
end
