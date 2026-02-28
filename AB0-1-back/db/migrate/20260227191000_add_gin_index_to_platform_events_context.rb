# frozen_string_literal: true

class AddGinIndexToPlatformEventsContext < ActiveRecord::Migration[7.0]
  def up
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    execute <<~SQL
      CREATE INDEX IF NOT EXISTS idx_platform_events_context_gin
      ON platform_events
      USING GIN (context);
    SQL
  end

  def down
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    execute 'DROP INDEX IF EXISTS idx_platform_events_context_gin;'
  end
end
