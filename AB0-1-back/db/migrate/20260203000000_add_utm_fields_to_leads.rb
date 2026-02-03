class AddUtmFieldsToLeads < ActiveRecord::Migration[7.0]
  def change
    change_table :leads, bulk: true do |t|
      t.string :utm_source
      t.string :utm_medium
      t.string :utm_campaign
      t.string :utm_content
      t.string :utm_term
      t.string :gclid
      t.string :fbclid
      t.string :msclkid
      t.string :landing_path
      t.string :referrer_host
      t.json :attribution_json, default: {}
    end

    add_index :leads, :utm_campaign
    add_index :leads, :utm_source
    add_index :leads, [:company_id, :utm_campaign]
    add_index :leads, :created_at
  end
end
