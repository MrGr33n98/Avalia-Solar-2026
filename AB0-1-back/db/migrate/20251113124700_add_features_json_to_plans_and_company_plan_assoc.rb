class AddFeaturesJsonToPlansAndCompanyPlanAssoc < ActiveRecord::Migration[7.0]
  def change
    if ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
      add_column :plans, :features_json, :jsonb, default: {}
    else
      add_column :plans, :features_json, :json, default: {}
    end
    add_reference :companies, :plan, foreign_key: true
    add_column :companies, :plan_status, :string, default: 'inactive'
    add_index :companies, :plan_status
  end
end
