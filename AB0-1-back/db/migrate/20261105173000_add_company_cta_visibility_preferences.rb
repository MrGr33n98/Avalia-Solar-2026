# frozen_string_literal: true

class AddCompanyCtaVisibilityPreferences < ActiveRecord::Migration[7.0]
  def change
    # Preserve existing quote visibility on paid accounts on upgrade.
    add_column :companies, :quote_cta_enabled, :boolean, default: true, null: false, if_not_exists: true
    # Dedicated revision avoids conflicts with unrelated profile edits.
    add_column :companies, :cta_visibility_version, :integer, default: 0, null: false, if_not_exists: true
  end
end
