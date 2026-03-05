class UpdateReviewUniqueness < ActiveRecord::Migration[7.0]
  def up
    # 1. Adicionar o novo índice de unicidade que inclui category_id
    # Nota: Registros com category_id NULL serão considerados únicos por par (user, company)
    # se usarmos o índice único padrão do Postgres.
    add_index :reviews, [:user_id, :company_id, :category_id], unique: true, name: 'idx_reviews_user_company_category'

    # 2. Remover o índice antigo (OPCIONAL: Podemos manter por um tempo ou remover agora se o backfill for garantido)
    # Por segurança em produção, removemos após o deploy e validação.
    # remove_index :reviews, name: "index_reviews_on_company_id_and_user_id"
  end

  def down
    remove_index :reviews, name: 'idx_reviews_user_company_category'
  end
end
