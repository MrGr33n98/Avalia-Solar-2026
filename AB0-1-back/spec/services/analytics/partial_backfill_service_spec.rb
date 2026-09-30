# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::PartialBackfillService, type: :service do
  let(:company) { create(:company) }
  let(:day) { Date.current }

  def insert_event(event_type:, payload:, occurred_at: Time.current)
    conn = ActiveRecord::Base.connection
    event_id = "test_evt_#{SecureRandom.hex(6)}"
    conn.execute(<<~SQL)
      INSERT INTO platform_events (
        event_id, event_type, schema_version, company_id, payload, context, occurred_at, created_at
      ) VALUES (
        #{conn.quote(event_id)}, #{conn.quote(event_type)}, 1, #{company.id},
        #{conn.quote(payload.to_json)}, '{}', #{conn.quote(occurred_at)}, #{conn.quote(Time.current)}
      )
    SQL
  end

  before do
    if ActiveRecord::Base.connection.table_exists?('platform_events')
      ActiveRecord::Base.connection.execute("DELETE FROM platform_events WHERE company_id = #{company.id}")
      ActiveRecord::Base.connection.execute("DELETE FROM company_daily_stats WHERE company_id = #{company.id}")
    end
  end

  it 'preserva o total cta_clicks e atualiza a dimensao quote_clicks de forma nao-aditiva' do
    skip 'Tabela platform_events não disponível neste ambiente' unless ActiveRecord::Base.connection.table_exists?('platform_events')

    # Criar estatística acumulada com 112 cta_clicks (0 quote_clicks)
    stat = CompanyDailyStat.create!(
      company_id: company.id,
      day: day,
      profile_views: 50,
      cta_clicks: 112,
      whatsapp_clicks: 0,
      email_clicks: 0,
      phone_clicks: 0,
      website_clicks: 0,
      quote_clicks: 0,
      leads: 0
    )

    # Inserir 2 raw events do tipo quote alinhados ao dia em UTC
    insert_event(event_type: 'cta_click', payload: { 'cta_type' => 'quote' }, occurred_at: day.beginning_of_day + 10.hours)
    insert_event(event_type: 'cta_click', payload: { 'cta_type' => 'request_quote' }, occurred_at: day.beginning_of_day + 11.hours)

    # 1. Testar DRY RUN (não deve alterar o banco)
    res_dry = described_class.call(company_id: company.id, from_day: day, to_day: day, dry_run: true)
    expect(res_dry.ok).to be(true), "Expected ok=true, got error: #{res_dry.error}"
    expect(res_dry.dry_run).to be true

    stat.reload
    expect(stat.cta_clicks).to eq(112)
    expect(stat.quote_clicks).to eq(0)

    # 2. Testar EXECUÇÃO REAL em banco TEST
    res_real = described_class.call(company_id: company.id, from_day: day, to_day: day, dry_run: false)
    expect(res_real.ok).to be(true), "Expected ok=true, got error: #{res_real.error}"
    expect(res_real.dry_run).to be false

    stat.reload
    # Invariantes: Total 112 estritamente preservado! Quote atualizado para 2!
    expect(stat.cta_clicks).to eq(112)
    expect(stat.quote_clicks).to eq(2)

    # Outros = 112 - 2 = 110
    classified = stat.whatsapp_clicks + stat.email_clicks + stat.phone_clicks + stat.website_clicks + stat.quote_clicks
    expect(classified).to eq(2)
    expect(stat.cta_clicks - classified).to eq(110)
  end
end
