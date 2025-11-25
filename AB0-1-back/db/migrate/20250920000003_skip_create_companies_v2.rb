class SkipCreateCompaniesV2 < ActiveRecord::Migration[7.0]
  def up
    # This migration does nothing because the companies table already exists
    # with all the fields that would be created by the 20250916012034_create_companies_v2.rb migration
    # We're just marking it as run to avoid conflicts
  end

  def down
    # This migration can't be rolled back meaningfully
  end
end