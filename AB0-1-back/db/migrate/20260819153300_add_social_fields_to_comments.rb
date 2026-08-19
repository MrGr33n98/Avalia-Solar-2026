class AddSocialFieldsToComments < ActiveRecord::Migration[7.0]
  def change
    unless table_exists?(:comments)
      create_table :comments do |t|
        t.references :user, null: false, foreign_key: true
        t.references :commentable, polymorphic: true, null: false
        t.references :parent, foreign_key: { to_table: :comments }, null: true
        t.text :body, null: false
        t.string :status, null: false, default: 'active'
        t.datetime :edited_at
        t.datetime :deleted_at

        t.timestamps
      end

      add_index :comments, [:commentable_type, :commentable_id]
      add_index :comments, :status
    else
      # Tabela legada comments já existe com (post_id, user_id, timestamps)
      # Adicionamos as colunas de polimorfismo e suporte social de forma evolutiva
      change_table :comments do |t|
        t.references :commentable, polymorphic: true, null: true
        t.references :parent, foreign_key: { to_table: :comments }, null: true
        t.text :body, null: true
        t.string :status, null: false, default: 'active'
        t.datetime :edited_at
        t.datetime :deleted_at
      end

      # Permite post_id nulo para comentários não atrelados ao modelo Post legado
      change_column_null :comments, :post_id, true if column_exists?(:comments, :post_id)

      add_index :comments, [:commentable_type, :commentable_id] unless index_exists?(:comments, [:commentable_type, :commentable_id])
      add_index :comments, :status unless index_exists?(:comments, :status)
    end
  end
end
