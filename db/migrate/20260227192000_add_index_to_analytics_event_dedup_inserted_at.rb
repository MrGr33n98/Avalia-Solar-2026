# frozen_string_literal: true

class AddIndexToAnalyticsEventDedupInsertedAt < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    add_index :analytics_event_dedup, :inserted_at, algorithm: :concurrently, if_not_exists: true
  end

  def down
    return unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    remove_index :analytics_event_dedup, :inserted_at, if_exists: true
  end
end
