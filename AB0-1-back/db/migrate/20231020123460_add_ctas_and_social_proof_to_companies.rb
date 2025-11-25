class AddCtasAndSocialProofToCompanies < ActiveRecord::Migration[7.0]
  def change
    # Remove the duplicate email_public column addition since it already exists
    unless column_exists?(:companies, :cta_primary_label)
      add_column :companies, :cta_primary_label, :string
      add_column :companies, :cta_primary_type, :string
      add_column :companies, :cta_primary_url, :string
      add_column :companies, :cta_secondary_label, :string
      add_column :companies, :cta_secondary_type, :string
      add_column :companies, :cta_secondary_url, :string
      add_column :companies, :cta_whatsapp_template, :text
      add_column :companies, :cta_utm_source, :string
      add_column :companies, :cta_utm_medium, :string
      add_column :companies, :cta_utm_campaign, :string
      add_column :companies, :ctas_json, :jsonb, default: {}
      add_column :companies, :founded_year, :integer
      add_column :companies, :employees_count, :integer
      add_column :companies, :rating_avg, :decimal, precision: 3, scale: 2, default: 0
      add_column :companies, :rating_count, :integer, default: 0
      add_column :companies, :awards, :text
      add_column :companies, :partner_brands, :text
      add_column :companies, :coverage_states, :text
      add_column :companies, :coverage_cities, :text
      add_column :companies, :latitude, :decimal, precision: 10, scale: 6
      add_column :companies, :longitude, :decimal, precision: 10, scale: 6
      add_column :companies, :minimum_ticket, :integer
      add_column :companies, :maximum_ticket, :integer
      add_column :companies, :financing_options, :text
      add_column :companies, :response_time_sla, :string
      add_column :companies, :languages, :text
    end
  end
end