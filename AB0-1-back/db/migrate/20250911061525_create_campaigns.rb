class CreateCampaigns < ActiveRecord::Migration[7.0]
  def change
    create_table :campaigns do |t|
      t.string :name
      t.text :description
      t.date :start_date
      t.date :end_date
      t.decimal :budget

      t.timestamps
    end
  end
end
