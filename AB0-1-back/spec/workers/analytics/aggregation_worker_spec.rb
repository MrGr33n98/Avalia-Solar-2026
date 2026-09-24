# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::AggregationWorker, type: :worker do
  let(:company) { create(:company) }
  let(:worker) { described_class.new }
  let(:is_pg) { ActiveRecord::Base.connection.adapter_name =~ /postgre/i }

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

  it 'agrega eventos de usuários públicos (inclusive self-referral) e descarta eventos de atores internos' do
    skip 'Tabela platform_events não disponível neste ambiente' unless ActiveRecord::Base.connection.table_exists?('platform_events')

    now = Time.current.beginning_of_day + 10.hours

    # 1. Usuário público legítimo (visita de perfil)
    insert_event(
      event_type: 'profile_view',
      payload: { 'referrer' => 'https://avaliasolar.com.br', 'is_internal' => false },
      occurred_at: now
    )

    # 2. Ator interno / Admin / Employee (deve ser excluído)
    insert_event(
      event_type: 'profile_view',
      payload: { 'is_internal' => true, 'is_admin' => true },
      occurred_at: now + 5.minutes
    )

    # 3. Superfície técnica (admin / app / auth) (deve ser excluído)
    insert_event(
      event_type: 'profile_view',
      payload: { 'surface' => 'admin' },
      occurred_at: now + 10.minutes
    )

    # 4. CTA legítimo
    insert_event(
      event_type: 'cta_click',
      payload: { 'cta_type' => 'whatsapp', 'is_internal' => false },
      occurred_at: now + 15.minutes
    )

    # Executar agregação
    worker.send(:aggregate_to_table, 'company_daily_stats', now.beginning_of_day, now.end_of_day, is_pg)

    stats = ActiveRecord::Base.connection.select_one(
      "SELECT * FROM company_daily_stats WHERE company_id = #{company.id} AND day = '#{now.to_date}'"
    )

    expect(stats).not_to be_nil
    # Apenas o profile_view do usuário público (1) deve ser computado. Os 2 internos foram descartados.
    expect(stats['profile_views'].to_i).to eq(1)
    expect(stats['cta_clicks'].to_i).to eq(1)
    expect(stats['whatsapp_clicks'].to_i).to eq(1)
  end
end
