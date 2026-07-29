class NormalizeChatLeadTemperatures < ActiveRecord::Migration[7.0]
  def up
    execute <<~SQL.squish
      UPDATE chat_leads
      SET lead_temperature = CASE lead_temperature
        WHEN 'cold' THEN 'frio'
        WHEN 'warm' THEN 'morno'
        WHEN 'hot' THEN 'quente'
        ELSE lead_temperature
      END
      WHERE lead_temperature IN ('cold', 'warm', 'hot')
    SQL
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
          'A origem dos valores portugueses não pode ser determinada com segurança.'
  end
end
