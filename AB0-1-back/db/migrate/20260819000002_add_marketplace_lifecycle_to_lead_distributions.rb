class AddMarketplaceLifecycleToLeadDistributions < ActiveRecord::Migration[7.0]
  def change
    if check_constraint_exists?(:leads, name: 'ck_leads_valid_status')
      remove_check_constraint :leads, name: 'ck_leads_valid_status'
      add_check_constraint :leads,
                           "wizard_status::text = ANY (ARRAY['draft','routing','pending_otp','verified','matched','open','in_progress','distributed','unmatched','converted','closed','proposal_submitted','proposal_processing','proposal_sent','proposal_failed']::text[])",
                           name: 'ck_leads_valid_status'
    end

    add_column :lead_distributions, :match_score, :integer unless column_exists?(:lead_distributions, :match_score)
    add_column :lead_distributions, :match_reasons, :jsonb, default: {}, null: false unless column_exists?(:lead_distributions, :match_reasons)
    add_column :lead_distributions, :sent_at, :datetime unless column_exists?(:lead_distributions, :sent_at)
    add_column :lead_distributions, :viewed_at, :datetime unless column_exists?(:lead_distributions, :viewed_at)
    add_column :lead_distributions, :accepted_at, :datetime unless column_exists?(:lead_distributions, :accepted_at)
    add_column :lead_distributions, :rejected_at, :datetime unless column_exists?(:lead_distributions, :rejected_at)
    add_column :lead_distributions, :expired_at, :datetime unless column_exists?(:lead_distributions, :expired_at)
    add_column :lead_distributions, :converted_at, :datetime unless column_exists?(:lead_distributions, :converted_at)
    add_column :lead_distributions, :rejection_reason, :string unless column_exists?(:lead_distributions, :rejection_reason)

    add_index :lead_distributions, %i[lead_id company_id], unique: true,
              name: 'index_lead_distributions_on_lead_and_company' unless index_exists?(:lead_distributions, %i[lead_id company_id], name: 'index_lead_distributions_on_lead_and_company')
    add_index :lead_distributions, %i[company_id status sent_at],
              name: 'index_lead_distributions_on_company_status_sent' unless index_exists?(:lead_distributions, %i[company_id status sent_at], name: 'index_lead_distributions_on_company_status_sent')
  end
end
