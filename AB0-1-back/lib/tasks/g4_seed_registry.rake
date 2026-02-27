# frozen_string_literal: true

namespace :g4 do
  desc "Seed official tracking spec into event_definitions registry"
  task seed_registry: :environment do
    unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i
      puts "Skipping registry seed. Database is not PostgreSQL."
      next
    end

    events = [
      {
        type: 'profile_view',
        req: '["company_id","session_id","page"]',
        opt: '["referrer","utm_source","utm_medium","utm_campaign","path","device"]',
        pii: '["ip","user_agent"]'
      },
      {
        type: 'cta_click',
        req: '["company_id","cta_type","url","session_id"]',
        opt: '["utm_source","utm_medium","utm_campaign","placement"]',
        pii: '["ip","user_agent"]'
      },
      {
        type: 'whatsapp_click',
        req: '["company_id","session_id"]',
        opt: '["placement","utm_source","utm_medium"]',
        pii: '["ip","user_agent"]'
      },
      {
        type: 'lead_created',
        req: '["company_id","lead_id"]',
        opt: '["source","utm_source","utm_medium"]',
        pii: '["email","phone","name","ip"]'
      },
      {
        type: 'review_created',
        req: '["company_id","review_id","rating"]',
        opt: '["nps_score"]',
        pii: '["ip"]'
      }
    ]

    events.each do |e|
      sql = <<~SQL
        INSERT INTO event_definitions (event_type, required_keys, pii_keys, description)
        VALUES ($1, $2::jsonb, $3::jsonb, 'Official tracking spec')
        ON CONFLICT (event_type) DO UPDATE SET
          required_keys = EXCLUDED.required_keys,
          pii_keys = EXCLUDED.pii_keys,
          updated_at = NOW();
      SQL

      ActiveRecord::Base.connection.exec_query(
        sql, 'SeedRegistry', 
        [[nil, e[:type]], [nil, e[:req]], [nil, e[:pii]]]
      )
    end

    puts "G4 Analytics Registry Seeded Successfully."
  end
end
