# frozen_string_literal: true

class AddEmailTrackingLifecycle < ActiveRecord::Migration[7.0]
  def up
    add_event_fields
    add_message_fields
    add_timeline_sequence
    backfill_legacy_lifecycle
  end

  def down
    remove_column :sales_opportunities, :sales_timeline_sequence
    validate_sender_required_for_rollback
    change_column_null :sales_email_messages, :sender_user_id, false
    remove_message_fields
    remove_event_fields
  end

  private

  def validate_sender_required_for_rollback
    return unless select_value('SELECT COUNT(*) FROM sales_email_messages WHERE sender_user_id IS NULL').to_i.positive?

    raise ActiveRecord::IrreversibleMigration,
          'Inbound email rows have no sender_user_id; export or remove them before rollback.'
  end

  def add_event_fields
    add_column :sales_email_events, :source, :string, null: false, default: 'legacy'
    add_column :sales_email_events, :received_at, :datetime
    add_column :sales_email_events, :dedupe_key, :string
    add_column :sales_email_events, :signal_class, :string, null: false, default: 'unknown'
    add_column :sales_email_events, :classification_reasons, :jsonb, null: false, default: []
    add_column :sales_email_events, :schema_version, :integer, null: false, default: 1
    add_column :sales_email_events, :timeline_sequence, :bigint
    add_index :sales_email_events, %i[company_id dedupe_key],
              unique: true, where: 'dedupe_key IS NOT NULL',
              name: 'idx_sales_email_events_company_dedupe'
    add_index :sales_email_events, %i[sales_email_message_id timeline_sequence],
              name: 'idx_sales_email_events_message_timeline_sequence'
  end

  def add_message_fields
    add_column :sales_email_messages, :direction, :string, null: false, default: 'outbound'
    add_column :sales_email_messages, :delivery_status, :string, null: false, default: 'queued'
    add_column :sales_email_messages, :engagement_status, :string, null: false, default: 'none'
    add_column :sales_email_messages, :raw_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :unique_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :human_likely_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :proxy_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :bot_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :scanner_open_signals, :integer, null: false, default: 0
    add_column :sales_email_messages, :raw_clicks, :integer, null: false, default: 0
    add_column :sales_email_messages, :unique_clicks, :integer, null: false, default: 0
    add_column :sales_email_messages, :bot_clicks, :integer, null: false, default: 0
    add_column :sales_email_messages, :scanner_clicks, :integer, null: false, default: 0
    add_column :sales_email_messages, :delayed_at, :datetime
    add_column :sales_email_messages, :rejected_at, :datetime
    add_column :sales_email_messages, :replied_at, :datetime
    change_column_null :sales_email_messages, :sender_user_id, true
  end

  def add_timeline_sequence
    add_column :sales_opportunities, :sales_timeline_sequence, :bigint, null: false, default: 0
  end

  def backfill_legacy_lifecycle
    backfill_delivery_and_counters
    backfill_engagement_state
  end

  def backfill_delivery_and_counters
    execute <<~SQL
      UPDATE sales_email_events SET received_at = created_at WHERE received_at IS NULL;
      UPDATE sales_email_messages SET
        delivery_status = CASE status
          WHEN 'delivered' THEN 'delivered'
          WHEN 'bounced' THEN 'bounced'
          WHEN 'failed' THEN 'failed'
          WHEN 'sending' THEN 'sending'
          WHEN 'sent' THEN 'sent'
          ELSE 'queued'
        END,
        raw_open_signals = open_count,
        unique_open_signals = CASE WHEN open_count > 0 THEN 1 ELSE 0 END,
        raw_clicks = click_count;
    SQL
    change_column_null :sales_email_events, :received_at, false
  end

  def backfill_engagement_state
    execute <<~SQL
      UPDATE sales_email_messages SET
        engagement_status = CASE
          WHEN replied_at IS NOT NULL THEN 'replied'
          WHEN click_count > 0 THEN 'clicked'
          WHEN open_count > 0 THEN 'open_signal'
          ELSE 'none'
        END;
    SQL
  end

  def remove_message_fields
    %i[direction delivery_status engagement_status raw_open_signals unique_open_signals
       human_likely_open_signals proxy_open_signals bot_open_signals scanner_open_signals raw_clicks
       unique_clicks bot_clicks scanner_clicks delayed_at rejected_at replied_at].each do |column|
      remove_column :sales_email_messages, column
    end
  end

  def remove_event_fields
    remove_index :sales_email_events, name: 'idx_sales_email_events_message_timeline_sequence'
    remove_index :sales_email_events, name: 'idx_sales_email_events_company_dedupe'
    %i[source received_at dedupe_key signal_class classification_reasons schema_version
       timeline_sequence].each do |column|
      remove_column :sales_email_events, column
    end
  end
end
