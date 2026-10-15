# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::ProspectsExportService, type: :service do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:from_time) { 5.days.ago.beginning_of_day }
  let(:to_time) { Time.current.end_of_day }

  describe '#call' do
    it 'gera CSV com UTF-8 BOM, cabeçalhos padronizados e labels legíveis' do
      click = company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://solar.com.br/contato',
        clicked_at: 2.days.ago,
        click_token_signature: 'sig-test'
      )

      csv_output = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time
      )

      expect(csv_output).to start_with("\uFEFF")
      expect(csv_output).to include('ID do Clique,Data/Hora (ISO8601),Origem no Marketplace,Tipo de Destino,URL de Destino,Status de Evidência')
      expect(csv_output).to include('Perfil no Marketplace')
      expect(csv_output).to include('Apenas clique')
      expect(csv_output).to include('https://solar.com.br/contato')
    end

    it 'sanitiza fórmulas maliciosas para evitar CSV Formula Injection' do
      account = Sales::Account.create!(
        company: company,
        owner: create(:user, company: company),
        name: '=cmd|"/C calc"!A0'
      )
      click = company.outbound_clicks.create!(
        source_context: 'compare',
        destination_type: 'website',
        target_url: '+https://malicious-formula.test',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-inj'
      )
      session = Sales::TrackingSession.create!(
        company: company,
        account: account,
        outbound_click: click,
        session_id: '@session-inj',
        referrer_host: '-calc.com',
        started_at: 1.day.ago
      )

      csv_output = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time
      )

      # Todos os valores que começam com = + - @ devem estar prefixados com aspas simples
      expect(csv_output).to include("'=cmd|")
      expect(csv_output).to include("'+https://malicious-formula.test")
      expect(csv_output).to include("'@session-inj")
      expect(csv_output).to include("'-calc.com")
    end

    it 'calcula corretamente a duração e o status de evidência da jornada' do
      click = company.outbound_clicks.create!(
        source_context: 'calculator',
        destination_type: 'cta_primary',
        target_url: 'https://wa.me/5511999999999',
        clicked_at: 2.days.ago,
        click_token_signature: 'sig-lead'
      )
      session = Sales::TrackingSession.create!(
        company: company,
        outbound_click: click,
        session_id: SecureRandom.uuid,
        started_at: 2.days.ago
      )
      Sales::TrackingEvent.create!(
        session: session,
        company: company,
        event_uuid: SecureRandom.uuid,
        event_name: 'page_view',
        occurred_at: 2.days.ago
      )
      Sales::TrackingEvent.create!(
        session: session,
        company: company,
        event_uuid: SecureRandom.uuid,
        event_name: 'lead_confirmed',
        occurred_at: 2.days.ago + 135.seconds
      )

      csv_output = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time
      )

      expect(csv_output).to include('Calculadora Solar')
      expect(csv_output).to include('Lead confirmado')
      expect(csv_output).to include('135') # Duração em segundos
      expect(csv_output).to include(',2,') # 2 eventos observados
    end

    it 'aplica filtros de busca e status de evidência' do
      click1 = company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://solar.com.br/promocao',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-c1'
      )
      click2 = company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://solar.com.br/blog',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-c2'
      )
      Sales::TrackingSession.create!(
        company: company,
        outbound_click: click2,
        session_id: SecureRandom.uuid,
        started_at: 1.day.ago
      )

      # Filtro de busca
      res_search = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time,
        params: { search: 'promocao' }
      )
      expect(res_search).to include('promocao')
      expect(res_search).not_to include('blog')

      # Filtro de evidência: apenas clique
      res_click_only = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time,
        params: { evidence_status: 'click_only' }
      )
      expect(res_click_only).to include('promocao')
      expect(res_click_only).not_to include('blog')

      # Filtro de evidência: chegada verificada
      res_landing = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time,
        params: { evidence_status: 'landing_verified' }
      )
      expect(res_landing).not_to include('promocao')
      expect(res_landing).to include('blog')
    end

    it 'isola dados e não vaza cliques de outros tenants' do
      other_company.outbound_clicks.create!(
        source_context: 'profile',
        destination_type: 'website',
        target_url: 'https://concorrente.com.br',
        clicked_at: 1.day.ago,
        click_token_signature: 'sig-other'
      )

      csv_output = described_class.call(
        company: company,
        from_time: from_time,
        to_time: to_time
      )

      expect(csv_output).not_to include('concorrente.com.br')
    end
  end
end
