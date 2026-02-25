class FinancingOptionSerializer < ActiveModel::Serializer
  attributes :id, :company_id,
             :institution_name, :credit_line, :target_audience,
             :max_term_months, :grace_period_months,
             :interest_rate_percent, :interest_rate_details,
             :active, :service_filters, :project_filters, :category_filters,
             :created_at, :updated_at
end
