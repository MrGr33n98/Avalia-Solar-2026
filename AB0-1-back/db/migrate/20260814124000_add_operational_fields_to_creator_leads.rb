class AddOperationalFieldsToCreatorLeads < ActiveRecord::Migration[7.0]
  def change
    add_column :creator_leads, :status, :string, null: false, default: 'new'
    add_column :creator_leads, :admin_notes, :text
    add_column :creator_leads, :handled_at, :datetime
    add_index :creator_leads, :status
  end
end
