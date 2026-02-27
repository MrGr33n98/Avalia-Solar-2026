class AddNicheTagsToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :niche_tags, :jsonb, default: []
    add_index :companies, :niche_tags, using: 'gin'
  end
end
