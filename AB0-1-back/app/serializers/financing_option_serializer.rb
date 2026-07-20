class FinancingOptionSerializer < ActiveModel::Serializer
  attributes :id, :company_id, :financial_institution_id,
             :institution_name, :credit_line, :target_audience,
             :amortization_system, :max_term_months, :grace_period_months,
             :interest_rate_percent, :interest_rate_details,
             :minimum_project_value, :maximum_project_value,
             :minimum_down_payment_percentage, :maximum_down_payment_percentage,
             :valid_from, :valid_until, :terms_url,
             :active, :display_order,
             :service_filters, :project_filters, :category_filters,
             :created_at, :updated_at
end
