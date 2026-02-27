class AddDataIntegrityConstraints < ActiveRecord::Migration[7.0]
  def change
    # 0. Data Cleanup: Ensure existing data follows the rules before applying constraints
    # This prevents migration failure on production data
    execute <<-SQL
      UPDATE companies 
      SET cnpj = NULL 
      WHERE cnpj IS NOT NULL 
        AND (LENGTH(cnpj) != 14 OR cnpj !~ '^[0-9]+$');
      
      UPDATE companies 
      SET email = NULL 
      WHERE email IS NOT NULL 
        AND email !~ '^[^@]+@[^@]+\\.[^@]+$';

      -- Cleanup orphan analytics events to allow NOT NULL constraint
      DELETE FROM analytics_events WHERE company_id IS NULL;

      -- Cleanup invalid ratings
      UPDATE reviews SET rating = 5.0 WHERE rating > 5;
      UPDATE reviews SET rating = 1.0 WHERE rating < 1;
      
      -- Cleanup invalid plan prices
      UPDATE plans SET price = 0 WHERE price < 0;

      -- Cleanup invalid banner subscription dates
      UPDATE banner_subscriptions SET ends_at = created_at WHERE ends_at < created_at;
    SQL

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

    # 5. Leads: Valid status (using wizard_status as the status column)
    add_check_constraint :leads,
      "wizard_status IN ('draft', 'pending_otp', 'verified', 'distributed', 'proposal_submitted', 'proposal_processing', 'proposal_sent', 'proposal_failed')",
      name: "ck_leads_valid_status"

    # 6. Plans: Valid pricing
    add_check_constraint :plans,
      "price >= 0",
      name: "ck_plans_valid_price"

    # 7. Banner subscriptions: created_at <= ends_at
    add_check_constraint :banner_subscriptions,
      "created_at <= ends_at",
      name: "ck_banner_subs_valid_dates"
  end
end
