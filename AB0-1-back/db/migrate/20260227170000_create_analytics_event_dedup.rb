class CreateAnalyticsEventDedup < ActiveRecord::Migration[7.0]
  def change
    is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i

    create_table :analytics_event_dedup, id: false do |t|
      t.text :event_id, primary_key: true
      t.datetime :inserted_at, null: false, default: -> { 'NOW()' }
    end
    add_index :analytics_event_dedup, :inserted_at
  end
end
