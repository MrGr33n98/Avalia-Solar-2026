# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Event Platform Integration DB', type: :model do
  before(:each) do
    @run_integration = ENV['RUN_DB_INTEGRATION'] == 'true' && ActiveRecord::Base.connection.adapter_name =~ /postgre/i
    if @run_integration
      ActiveRecord::Base.connection.execute("TRUNCATE platform_events CASCADE")
      ActiveRecord::Base.connection.execute("TRUNCATE company_daily_stats CASCADE")
      ActiveRecord::Base.connection.execute("TRUNCATE company_feature_daily CASCADE")
      ActiveRecord::Base.connection.execute("TRUNCATE analytics_event_dedup CASCADE")
    end
  end

  it 'processes events end-to-end idempotently', if: -> { @run_integration } do
    test_event_id = "test_id_#{SecureRandom.hex(6)}"
    
    # Create required data
    ActiveRecord::Base.connection.execute("INSERT OR IGNORE INTO companies (id, name, slug, status, created_at, updated_at) VALUES (99, 'Test Company', 'test-company', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    ActiveRecord::Base.connection.execute("INSERT OR IGNORE INTO event_definitions (event_type, required_keys, enabled) VALUES ('profile_view', '[]', 1)")
    
    # 1. Ingest
    res = Analytics::TrackEventService.call(company_id: 99, event_type: 'profile_view', metadata: {}, event_id: test_event_id)
    expect(res.ok).to be true
    
    # Fast path
    Analytics::AggregationWorker.new.perform
    stats = ActiveRecord::Base.connection.select_one("SELECT * FROM company_daily_stats WHERE company_id = 99")
    expect(stats['profile_views'].to_i).to eq(1)

    # Derived
    Analytics::FeatureStoreDailyWorker.new.aggregate_day(Date.current)
    features = ActiveRecord::Base.connection.select_one("SELECT * FROM company_feature_daily WHERE company_id = 99")
    expect(features['engagement_score'].to_i).to eq(1)

    # Idempotency checks
    res_dup = Analytics::TrackEventService.call(company_id: 99, event_type: 'profile_view', metadata: {}, event_id: test_event_id)
    expect(res_dup.ok).to be true
    expect(res_dup.error).to eq('duplicate_event')

    Analytics::AggregationWorker.new.perform
    Analytics::FeatureStoreDailyWorker.new.aggregate_day(Date.current)
    
    stats2 = ActiveRecord::Base.connection.select_one("SELECT * FROM company_daily_stats WHERE company_id = 99")
    expect(stats2['profile_views'].to_i).to eq(1) # Ensure no double counting occurred
  end
end
