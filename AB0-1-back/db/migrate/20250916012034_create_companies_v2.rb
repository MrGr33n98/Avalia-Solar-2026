class CreateCompaniesV2 < ActiveRecord::Migration[7.0]
  def change
    # Check if table exists before creating it
    unless table_exists?(:companies)
      create_table :companies do |t|
        t.string :name
        t.string :email
        t.string :cnpj
        t.text :description
        t.string :state
        t.string :city
        t.boolean :featured, default: false
        t.boolean :verified, default: false
        t.float :rating_cache
        t.integer :reviews_count, default: 0
        t.string :instagram
        t.string :facebook
        t.string :linkedin
        t.string :working_hours
        t.string :payment_methods
        t.string :status, default: 'active'
        t.text :certifications
        t.string :cta_primary_label
        t.string :cta_primary_type
        t.string :cta_primary_url
        t.string :cta_secondary_label
        t.string :cta_secondary_type
        t.string :cta_secondary_url
        t.string :cta_whatsapp_template

        t.timestamps
      end

      add_index :companies, :email, unique: true
      add_index :companies, :cnpj, unique: true
    end
  end
end