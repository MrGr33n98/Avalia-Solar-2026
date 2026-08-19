class CreatePublicationEntities < ActiveRecord::Migration[7.0]
  def change
    create_table :publication_entities do |t|
      t.references :publication, null: false, foreign_key: { to_table: :reviewer_publications }
      t.references :entity, polymorphic: true, null: false
      t.string :relation_type, null: false, default: 'mentioned'

      t.timestamps
    end

    add_index :publication_entities, [:publication_id, :entity_type, :entity_id], unique: true, name: 'idx_pub_entities_unique'
    add_index :publication_entities, :relation_type
  end
end
