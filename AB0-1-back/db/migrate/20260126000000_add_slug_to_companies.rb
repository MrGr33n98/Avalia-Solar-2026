class AddSlugToCompanies < ActiveRecord::Migration[7.0]
  class MigrationCompany < ApplicationRecord
    self.table_name = 'companies'
  end

  def up
    add_column :companies, :slug, :string
    add_index :companies, :slug, unique: true

    MigrationCompany.reset_column_information

    say_with_time 'Backfilling company slugs' do
      MigrationCompany.find_each do |company|
        base = (company.slug.presence || company.name.to_s.parameterize)
        base = "company-#{company.id}" if base.blank?
        slug = base
        counter = 2

        while MigrationCompany.where.not(id: company.id).exists?(slug: slug)
          slug = "#{base}-#{counter}"
          counter += 1
        end

        company.update_columns(slug: slug)
      end
    end

    change_column_null :companies, :slug, false
  end

  def down
    remove_index :companies, :slug
    remove_column :companies, :slug
  end
end
