# frozen_string_literal: true

class AddPrimaryCategoryToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_reference :companies, :primary_category, foreign_key: { to_table: :categories }, index: true
  end
end
