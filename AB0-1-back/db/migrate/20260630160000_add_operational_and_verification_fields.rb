class AddOperationalAndVerificationFields < ActiveRecord::Migration[7.0]
  def change
    # Novas colunas na tabela companies
    add_column :companies, :business_verification_status, :string, default: 'unverified', null: false
    add_column :companies, :business_verified_at, :datetime
    add_column :companies, :business_verification_method, :string
    add_column :companies, :delivered_projects_count, :integer, default: 0, null: false
    add_column :companies, :response_sla_minutes, :integer
    add_column :companies, :operational_data_updated_at, :datetime

    # Novas colunas na tabela review_aggregates
    add_column :review_aggregates, :nps_score, :decimal, precision: 4, scale: 2
    add_column :review_aggregates, :nps_responses, :integer, default: 0, null: false
    add_column :review_aggregates, :recommendation_rate, :decimal, precision: 4, scale: 2
    add_column :review_aggregates, :rating_classification_distribution, :jsonb, default: {}, null: false
  end
end
