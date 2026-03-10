class CreateBuyerIntentActivities < ActiveRecord::Migration[7.0]
  def change
    create_table :buyer_intent_activities do |t|

      t.timestamps
    end
  end
end
