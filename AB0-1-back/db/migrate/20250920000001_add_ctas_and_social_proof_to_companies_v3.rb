class AddCtasAndSocialProofToCompaniesV3 < ActiveRecord::Migration[7.0]
  def change
    # Check if columns exist before adding them to prevent duplicates
    unless column_exists?(:companies, :cta_primary_label)
      add_column :companies, :cta_primary_label, :string
    end
    
    unless column_exists?(:companies, :cta_primary_type)
      add_column :companies, :cta_primary_type, :string
    end
    
    unless column_exists?(:companies, :cta_primary_url)
      add_column :companies, :cta_primary_url, :string
    end
    
    unless column_exists?(:companies, :cta_secondary_label)
      add_column :companies, :cta_secondary_label, :string
    end
    
    unless column_exists?(:companies, :cta_secondary_type)
      add_column :companies, :cta_secondary_type, :string
    end
    
    unless column_exists?(:companies, :cta_secondary_url)
      add_column :companies, :cta_secondary_url, :string
    end
    
    unless column_exists?(:companies, :cta_whatsapp_template)
      add_column :companies, :cta_whatsapp_template, :text
    end
    
    unless column_exists?(:companies, :cta_utm_source)
      add_column :companies, :cta_utm_source, :string
    end
    
    unless column_exists?(:companies, :cta_utm_medium)
      add_column :companies, :cta_utm_medium, :string
    end
    
    unless column_exists?(:companies, :cta_utm_campaign)
      add_column :companies, :cta_utm_campaign, :string
    end
    
    unless column_exists?(:companies, :ctas_json)
      add_column :companies, :ctas_json, :jsonb, default: {}
    end
    
    unless column_exists?(:companies, :founded_year)
      add_column :companies, :founded_year, :integer
    end
    
    unless column_exists?(:companies, :employees_count)
      add_column :companies, :employees_count, :integer
    end
    
    unless column_exists?(:companies, :rating_avg)
      add_column :companies, :rating_avg, :decimal, precision: 3, scale: 2, default: 0
    end
    
    unless column_exists?(:companies, :rating_count)
      add_column :companies, :rating_count, :integer, default: 0
    end
    
    unless column_exists?(:companies, :awards)
      add_column :companies, :awards, :text
    end
    
    unless column_exists?(:companies, :partner_brands)
      add_column :companies, :partner_brands, :text
    end
    
    unless column_exists?(:companies, :coverage_states)
      add_column :companies, :coverage_states, :text
    end
    
    unless column_exists?(:companies, :coverage_cities)
      add_column :companies, :coverage_cities, :text
    end
    
    unless column_exists?(:companies, :latitude)
      add_column :companies, :latitude, :decimal, precision: 10, scale: 6
    end
    
    unless column_exists?(:companies, :longitude)
      add_column :companies, :longitude, :decimal, precision: 10, scale: 6
    end
    
    unless column_exists?(:companies, :minimum_ticket)
      add_column :companies, :minimum_ticket, :integer
    end
    
    unless column_exists?(:companies, :maximum_ticket)
      add_column :companies, :maximum_ticket, :integer
    end
    
    unless column_exists?(:companies, :financing_options)
      add_column :companies, :financing_options, :text
    end
    
    unless column_exists?(:companies, :response_time_sla)
      add_column :companies, :response_time_sla, :string
    end
    
    unless column_exists?(:companies, :languages)
      add_column :companies, :languages, :text
    end
  end
end