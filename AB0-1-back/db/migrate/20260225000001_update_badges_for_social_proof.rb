class UpdateBadgesForSocialProof < ActiveRecord::Migration[7.0]
  def up
    # 1. Adicionar novas colunas à tabela badges (de forma idempotente)
    add_column :badges, :active, :boolean, default: true, null: false unless column_exists?(:badges, :active)
    add_column :badges, :category_label, :string unless column_exists?(:badges, :category_label)
    add_column :badges, :edition, :integer unless column_exists?(:badges, :edition)
    add_column :badges, :public_slug, :string unless column_exists?(:badges, :public_slug)

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
    
    remove_column :badges, :active if column_exists?(:badges, :active)
    remove_column :badges, :category_label if column_exists?(:badges, :category_label)
    remove_column :badges, :edition if column_exists?(:badges, :edition)
    remove_column :badges, :public_slug if column_exists?(:badges, :public_slug)
    
    add_reference :badges, :category, null: true unless column_exists?(:badges, :category_id)
    add_column :badges, :products, :string unless column_exists?(:badges, :products)

    drop_table :company_badges if table_exists?(:company_badges)
  end
end
