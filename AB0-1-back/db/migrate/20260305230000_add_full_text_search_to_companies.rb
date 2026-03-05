class AddFullTextSearchToCompanies < ActiveRecord::Migration[7.0]
  def up
    # Adiciona o índice GIN funcional para busca textual em português
    # Combinamos name e description para a busca
    execute <<-SQL
      CREATE INDEX index_companies_on_full_text_search ON companies 
      USING gin(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(description, '')));
    SQL
  end

  def down
    execute "DROP INDEX index_companies_on_full_text_search"
  end
end
