class RequireBrandContextForProductEvents < ActiveRecord::Migration[7.0]
  BRAND_KEYS = %w[brand_id brand_slug app_key].freeze
  BRAND_EVENTS = %w[
    product_view
    product_impression
    product_click
    product_cta_click
    product_company_click
    product_share
  ].freeze

  def up
    return unless table_exists?(:event_definitions)

    BRAND_EVENTS.each do |event_type|
      upsert_event_definition(event_type)
    end

    execute <<~SQL
      UPDATE event_definitions
      SET required_keys = (
        SELECT jsonb_agg(DISTINCT key_name)
        FROM jsonb_array_elements_text(required_keys || '#{BRAND_KEYS.to_json}'::jsonb) AS key_name
      )
      WHERE event_type IN (#{BRAND_EVENTS.map { |e| ActiveRecord::Base.connection.quote(e) }.join(', ')});
    SQL
  end

  def down
    return unless table_exists?(:event_definitions)

    execute <<~SQL
      UPDATE event_definitions
      SET required_keys = (required_keys - 'brand_id' - 'brand_slug' - 'app_key')
      WHERE event_type IN (#{BRAND_EVENTS.map { |e| ActiveRecord::Base.connection.quote(e) }.join(', ')});
    SQL
  end

  private

  def upsert_event_definition(event_type)
    now = Time.current
    keys = BRAND_KEYS.to_json
    connection = ActiveRecord::Base.connection
    connection.execute <<~SQL
      INSERT INTO event_definitions (event_type, required_keys, created_at, updated_at)
      VALUES (#{connection.quote(event_type)}, '#{keys}'::jsonb, #{connection.quote(now)}, #{connection.quote(now)})
      ON CONFLICT (event_type)
      DO UPDATE SET updated_at = EXCLUDED.updated_at;
    SQL
  end
end
