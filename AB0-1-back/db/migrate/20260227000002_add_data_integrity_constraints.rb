class AddDataIntegrityConstraints < ActiveRecord::Migration[7.0]
  def change
    # 1. Companies: Valid CNPJ format
    add_check_constraint :companies,
      "cnpj IS NULL OR (LENGTH(cnpj) = 14 AND cnpj ~ '^[0-9]+$')",
      name: "ck_companies_valid_cnpj"

    # 2. Companies: Valid email
    add_check_constraint :companies,
      "email IS NULL OR email ~ '^[^@]+@[^@]+\\.[^@]+$'",
      name: "ck_companies_valid_email"

    # 3. Analytics: company_id required
    change_column_null :analytics_events, :company_id, false

    # 4. Reviews: Valid rating (1-5)
    add_check_constraint :reviews,
      "rating >= 1 AND rating <= 5",
      name: "ck_reviews_valid_rating"

    # 5. Leads: Valid status
    add_check_constraint :leads,
      "status IN ('new', 'contacted', 'qualified', 'closed', 'lost')",
      name: "ck_leads_valid_status"

    # 6. Plans: Valid pricing
    add_check_constraint :plans,
      "price >= 0",
      name: "ck_plans_valid_price"

    # 7. Banner subscriptions: created_at <= expires_at
    add_check_constraint :banner_subscriptions,
      "created_at <= expires_at",
      name: "ck_banner_subs_valid_dates"
  end
end
