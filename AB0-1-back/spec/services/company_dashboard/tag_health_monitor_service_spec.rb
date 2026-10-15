# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::TagHealthMonitorService, type: :service do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }

  describe '#call' do
    context 'quando a empresa não possui TrackingSite configurado' do
      it 'retorna status uninstalled' do
        result = described_class.call(company: company)

        expect(result[:configured]).to be(false)
        expect(result[:active]).to be(false)
        expect(result[:status]).to eq('tag_not_installed')
        expect(result[:public_key]).to be_nil
        expect(result[:events_last_24h]).to eq(0)
        expect(result[:consent_grant_rate]).to be_nil
      end
    end

    context 'quando o site está desativado' do
      it 'retorna status inactive' do
        Sales::TrackingSite.create!(company: company, active: false, allowed_origins: ['https://site.com.br'])

        result = described_class.call(company: company)

        expect(result[:configured]).to be(true)
        expect(result[:active]).to be(false)
        expect(result[:status]).to eq('inactive')
      end
    end

    context 'quando o site está ativo mas não há telemetria' do
      it 'retorna status configured_no_evidence' do
        Sales::TrackingSite.create!(company: company, active: true, allowed_origins: ['https://site.com.br'])

        result = described_class.call(company: company)

        expect(result[:configured]).to be(true)
        expect(result[:active]).to be(true)
        expect(result[:status]).to eq('configured_no_evidence')
        expect(result[:events_last_24h]).to eq(0)
        expect(result[:events_last_7d]).to eq(0)
      end
    end

    context 'quando a última telemetria tem mais de 7 dias' do
      it 'retorna status possibly_inactive' do
        Sales::TrackingSite.create!(company: company, active: true, allowed_origins: ['https://site.com.br'])
        session = Sales::TrackingSession.create!(
          company: company,
          session_id: SecureRandom.uuid,
          started_at: 10.days.ago
        )
        Sales::TrackingEvent.create!(
          session: session,
          company: company,
          event_uuid: SecureRandom.uuid,
          event_name: 'page_view',
          occurred_at: 10.days.ago
        )

        result = described_class.call(company: company)

        expect(result[:status]).to eq('possibly_inactive')
        expect(result[:events_last_7d]).to eq(0)
      end
    end

    context 'quando há telemetria recente ativa' do
      let!(:site) do
        Sales::TrackingSite.create!(
          company: company,
          active: true,
          allowed_origins: ['https://solar.com.br', 'http://localhost:3000'],
          settings: { 'ga4' => { 'measurement_id' => 'G-ABC123' } }
        )
      end

      before do
        # Sessão 1: consentida há 2 horas
        session1 = Sales::TrackingSession.create!(
          company: company,
          session_id: SecureRandom.uuid,
          consent_state: 'granted',
          referrer_host: 'solar.com.br',
          started_at: 2.hours.ago
        )
        Sales::TrackingEvent.create!(
          session: session1,
          company: company,
          event_uuid: SecureRandom.uuid,
          event_name: 'page_view',
          occurred_at: 2.hours.ago
        )
        Sales::TrackingEvent.create!(
          session: session1,
          company: company,
          event_uuid: SecureRandom.uuid,
          event_name: 'form_submitted',
          occurred_at: 1.hour.ago
        )

        # Sessão 2: não consentida há 3 dias
        session2 = Sales::TrackingSession.create!(
          company: company,
          session_id: SecureRandom.uuid,
          consent_state: 'denied',
          referrer_host: 'blog.solar.com.br',
          started_at: 3.days.ago
        )
        Sales::TrackingEvent.create!(
          session: session2,
          company: company,
          event_uuid: SecureRandom.uuid,
          event_name: 'page_view',
          occurred_at: 3.days.ago
        )

        # Eventos de outra empresa (não devem vazar)
        other_session = Sales::TrackingSession.create!(
          company: other_company,
          session_id: SecureRandom.uuid,
          consent_state: 'granted',
          referrer_host: 'invasor.com',
          started_at: 1.hour.ago
        )
        Sales::TrackingEvent.create!(
          session: other_session,
          company: other_company,
          event_uuid: SecureRandom.uuid,
          event_name: 'lead_confirmed',
          occurred_at: 1.hour.ago
        )
      end

      it 'retorna status healthy com métricas calculadas e isolamento multi-tenant' do
        result = described_class.call(company: company)

        expect(result[:status]).to eq('healthy')
        expect(result[:configured]).to be(true)
        expect(result[:active]).to be(true)
        expect(result[:public_key]).to eq(site.public_key)
        expect(result[:events_last_24h]).to eq(2) # 2 eventos nas últimas 24h
        expect(result[:events_last_7d]).to eq(3)  # 3 eventos nos últimos 7 dias
        expect(result[:sessions_last_7d]).to eq(2) # 2 sessões nos últimos 7 dias
        expect(result[:consent_grant_rate]).to eq(50.0) # 1 de 2 = 50.0%
        expect(result[:validated_https_origins]).to be(true)
        expect(result[:observed_referrer_hosts]).to contain_exactly('solar.com.br', 'blog.solar.com.br')
        expect(result[:observed_referrer_hosts]).not_to include('invasor.com')
        expect(result[:settings]).to eq({ 'ga4' => { 'measurement_id' => 'G-ABC123' } })
      end
    end
  end
end
