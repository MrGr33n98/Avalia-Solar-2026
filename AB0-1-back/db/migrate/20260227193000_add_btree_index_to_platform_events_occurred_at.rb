# frozen_string_literal: true

class AddBtreeIndexToPlatformEventsOccurredAt < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    execute "SET lock_timeout = '5s'"
    execute "SET statement_timeout = '15min'"

    execute <<~SQL
      CREATE INDEX IF NOT EXISTS
      idx_platform_events_occurred_at_btree
      ON platform_events (occurred_at);
    SQL
  end

  def down
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    execute "SET lock_timeout = '5s'"
    execute "SET statement_timeout = '15min'"

    execute 'DROP INDEX IF EXISTS idx_platform_events_occurred_at_btree;'
  end
end
