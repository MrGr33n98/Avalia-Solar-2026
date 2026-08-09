class UpdateBannerEvents < ActiveRecord::Migration[7.0]
  def change
    # Adicionando chave de deduplicação e contexto de placement
    add_column :banner_events, :event_key, :string
    add_column :banner_events, :page_path, :string
    add_column :banner_events, :slot_key, :string
    add_column :banner_events, :placement, :string
    
    # Adicionando colunas UTM explícitas para facilitar agregação / filtros sem parse JSON
    add_column :banner_events, :utm_source, :string
    add_column :banner_events, :utm_medium, :string
    add_column :banner_events, :utm_campaign, :string
    add_column :banner_events, :utm_term, :string
    add_column :banner_events, :utm_content, :string

    # Índices para deduplicação e analytics
    add_index :banner_events, :event_key, unique: true, where: "event_key IS NOT NULL"
    add_index :banner_events, [:banner_id, :event_type, :placement]
  end
end
