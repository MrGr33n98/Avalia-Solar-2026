class AddQuoteCtaEnabledToCompanies < ActiveRecord::Migration[7.0]
  def change
    # Backward-compatible rollout: existing entitled companies keep their quote CTA.
    add_column :companies, :quote_cta_enabled, :boolean, default: true, null: false
  end
end
