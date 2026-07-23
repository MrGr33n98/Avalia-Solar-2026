# frozen_string_literal: true

class RegisterContentIntentEvents < ActiveRecord::Migration[7.0]
  EVENTS = {
    'material_list_viewed' => { required_keys: [], description: 'Lista pública de materiais visualizada.' },
    'material_download_clicked' => { required_keys: %w[material_id material_slug], description: 'Visitante solicitou download de material.' },
    'material_gate_viewed' => { required_keys: %w[material_id material_slug], description: 'Formulário de acesso a material aberto.' },
    'material_form_submitted' => { required_keys: %w[material_id material_slug], description: 'Formulário de material enviado sem dados pessoais no evento.' },
    'material_download_authorized' => { required_keys: %w[material_id], description: 'Servidor autorizou entrega de material.' },
    'material_download_delivered' => { required_keys: %w[material_id], description: 'Servidor confirmou entrega técnica de material.' }
  }.freeze

  def up
    return unless table_exists?(:event_definitions)

    EVENTS.each do |event_type, definition|
      execute <<~SQL.squish
        INSERT INTO event_definitions (event_type, schema_version, required_keys, pii_keys, retention_policy, description, enabled, created_at, updated_at)
        VALUES (#{quote(event_type)}, 1, #{quote(definition[:required_keys].to_json)}::jsonb, '[]'::jsonb, '{"months":24}'::jsonb, #{quote(definition[:description])}, TRUE, NOW(), NOW())
        ON CONFLICT (event_type) DO UPDATE
        SET required_keys = EXCLUDED.required_keys, pii_keys = EXCLUDED.pii_keys, description = EXCLUDED.description, enabled = TRUE, updated_at = NOW()
      SQL
    end
  end

  def down
    return unless table_exists?(:event_definitions)

    execute "DELETE FROM event_definitions WHERE event_type IN (#{EVENTS.keys.map { |key| quote(key) }.join(', ')})"
  end
end
