class FixJsonIndexInSectorRatings < ActiveRecord::Migration[7.0]
  def up
    # Remove o índice B-tree que causa erro em colunas JSON
    if index_exists?(:sector_ratings, :answers, name: 'index_sector_ratings_on_answers')
      remove_index :sector_ratings, name: 'index_sector_ratings_on_answers'
    end

    # Altera para JSONB que é o padrão recomendado para Postgres e suporta índices GIN
    change_column :sector_ratings, :answers, :jsonb, default: {}, null: false, using: 'answers::jsonb'

    # Opcional: Adiciona um índice GIN se busca for necessária
    add_index :sector_ratings, :answers, using: :gin
  end

  def down
    remove_index :sector_ratings, :answers if index_exists?(:sector_ratings, :answers)
    change_column :sector_ratings, :answers, :json, default: {}, null: false, using: 'answers::json'
    add_index :sector_ratings, :answers, name: 'index_sector_ratings_on_answers'
  end
end
