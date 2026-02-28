class AddNicheTagsToCompanies < ActiveRecord::Migration[7.0]
  def up
    if postgres?
      add_column :companies, :niche_tags, :jsonb, default: [], null: false unless column_exists?(:companies, :niche_tags)
      add_index :companies, :niche_tags, using: :gin, if_not_exists: true
    else
      add_column :companies, :niche_tags, :json, default: [], null: false unless column_exists?(:companies, :niche_tags)
    end
  end

  def down
    remove_index :companies, :niche_tags, if_exists: true
    remove_column :companies, :niche_tags if column_exists?(:companies, :niche_tags)
  end

  private

  def postgres?
    ActiveRecord::Base.connection.adapter_name =~ /postgre/i
  end
end
