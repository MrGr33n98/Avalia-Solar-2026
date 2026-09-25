# frozen_string_literal: true

class CreateSalesTrackingSitesAndPublicSessions < ActiveRecord::Migration[7.0]
  def change
    create_tracking_sites
    add_session_attribution
    add_event_idempotency
    backfill_tracking_tenant
  end

  private

  def create_tracking_sites
    create_table :sales_tracking_sites do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.string :public_key, null: false
      t.jsonb :allowed_origins, null: false, default: []
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :sales_tracking_sites, :public_key, unique: true
  end

  def add_session_attribution
    add_reference :sales_tracking_sessions, :company, foreign_key: true
    add_column :sales_tracking_sessions, :referrer_host, :string
    add_column :sales_tracking_sessions, :landing_path, :string
    add_column :sales_tracking_sessions, :traffic_class, :string, null: false, default: 'commercial'
    add_index :sales_tracking_sessions, %i[company_id started_at],
              name: 'index_sales_tracking_sessions_on_company_and_started'
  end

  def add_event_idempotency
    add_reference :sales_tracking_events, :company, foreign_key: true
    add_column :sales_tracking_events, :event_uuid, :string
    index_name = 'index_sales_tracking_events_on_public_event_idempotency'
    index_options = { unique: true, where: 'event_uuid IS NOT NULL', name: index_name }
    add_index :sales_tracking_events, %i[company_id session_id event_uuid], **index_options
  end

  def backfill_tracking_tenant
    reversible do |direction|
      direction.up do
        backfill_session_accounts
        backfill_session_contacts
        backfill_event_company
      end
    end
  end

  def backfill_session_accounts
    execute <<~SQL.squish
      UPDATE sales_tracking_sessions ts
      SET company_id = sa.company_id
      FROM sales_accounts sa
      WHERE ts.account_id = sa.id AND ts.company_id IS NULL
    SQL
  end

  def backfill_session_contacts
    execute <<~SQL.squish
      UPDATE sales_tracking_sessions ts
      SET company_id = sa.company_id
      FROM sales_contacts sc
      JOIN sales_accounts sa ON sa.id = sc.sales_account_id
      WHERE ts.contact_id = sc.id AND ts.company_id IS NULL
    SQL
  end

  def backfill_event_company
    execute <<~SQL.squish
      UPDATE sales_tracking_events te
      SET company_id = ts.company_id
      FROM sales_tracking_sessions ts
      WHERE te.session_id = ts.session_id AND te.company_id IS NULL
    SQL
  end
end
