class UpdateBadgesForSocialProof < ActiveRecord::Migration[7.0]
  def up
    # 1. Adicionar novas colunas à tabela badges
    change_table :badges, bulk: true do |t|
      t.boolean :active, default: true, null: false
      t.string :category_label
      t.integer :edition
      t.string :public_slug
    end

    # 2. Criar tabela de junção company_badges se não existir
    unless table_exists?(:company_badges)
      create_table :company_badges do |t|
        t.references :company, null: false, foreign_key: true
        t.references :badge, null: false, foreign_key: true
        t.timestamps
      end
      add_index :company_badges, [:company_id, :badge_id], unique: true
    end

    # 3. Remover colunas antigas ou desnecessárias
    # Nota: No commit anterior, category_id era opcional e products era uma string/json
    remove_column :badges, :category_id if column_exists?(:badges, :category_id)
    remove_column :badges, :products if column_exists?(:badges, :products)

    # 4. Adicionar index de busca por slug
    add_index :badges, :public_slug, unique: true
  end

  def down
    remove_index :badges, :public_slug if index_exists?(:badges, :public_slug)
    
    change_table :badges, bulk: true do |t|
      t.remove :active, :category_label, :edition, :public_slug
      t.references :category, optional: true
      t.string :products
    end

    drop_table :company_badges if table_exists?(:company_badges)
  end
end
