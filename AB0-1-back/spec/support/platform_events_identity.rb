# frozen_string_literal: true

RSpec.configure do |config|
  config.before(:suite) do
    connection = ActiveRecord::Base.connection
    next unless connection.adapter_name.downcase.include?('postgresql')
    next unless connection.table_exists?('platform_events')

    id_default = connection.select_value(<<~SQL.squish)
      SELECT column_default
      FROM information_schema.columns
      WHERE table_name = 'platform_events'
        AND column_name = 'id'
    SQL
    next if id_default.present?

    connection.execute('CREATE SEQUENCE IF NOT EXISTS platform_events_id_seq')
    connection.execute(<<~SQL.squish)
      ALTER TABLE platform_events
      ALTER COLUMN id SET DEFAULT nextval('platform_events_id_seq')
    SQL
  end
end
