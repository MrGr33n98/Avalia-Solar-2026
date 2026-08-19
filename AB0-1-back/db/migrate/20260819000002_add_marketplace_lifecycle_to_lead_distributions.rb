class AddMarketplaceLifecycleToLeadDistributions < ActiveRecord::Migration[7.0]
  def up
    # Safe check constraint existence check in Rails 7
    constraint_exists = false
    if connection.respond_to?(:check_constraints)
      begin
        constraint_exists = connection.check_constraints(:leads).any? do |constraint|
          constraint.name == 'ck_leads_valid_status'
        end
      rescue => e
        Rails.logger.warn("Could not check constraints: #{e.message}")
      end
    end

    if constraint_exists
      remove_check_constraint :leads, name: 'ck_leads_valid_status'
    end

    add_check_constraint :leads,
                         "wizard_status::text = ANY (ARRAY['draft','routing','pending_otp','verified','matched','open','in_progress','distributed','unmatched','converted','closed','proposal_submitted','proposal_processing','proposal_sent','proposal_failed']::text[])",
                         name: 'ck_leads_valid_status'

    # Deduplicate lead distributions before creating unique index
    duplicates = connection.select_all(<<-SQL)
      SELECT lead_id, company_id, COUNT(*)
      FROM lead_distributions
      GROUP BY lead_id, company_id
      HAVING COUNT(*) > 1
    SQL

    duplicates.each do |row|
      lead_id = row['lead_id']
      company_id = row['company_id']
      dist_ids = connection.select_values(
        connection.sanitize_sql_array([
          "SELECT id FROM lead_distributions WHERE lead_id = ? AND company_id = ? ORDER BY updated_at DESC, id DESC",
          lead_id, company_id
        ])
      )
      # Keep the most recent, delete others
      to_delete = dist_ids[1..-1]
      if to_delete.any?
        connection.execute(
          connection.sanitize_sql_array([
            "DELETE FROM lead_distributions WHERE id IN (?)",
            to_delete
          ])
        )
      end
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

    # Seed required strict analytics event definitions if table exists
    if table_exists?(:event_definitions)
      new_events = %w[lead_routing_started lead_distributed lead_distribution_viewed lead_distribution_accepted lead_distribution_rejected lead_distribution_expired lead_rerouted]
      new_events.each do |event_type|
        execute <<~SQL.squish
          INSERT INTO event_definitions (event_type, required_keys, pii_keys, description, enabled, created_at, updated_at)
          VALUES (#{connection.quote(event_type)}, '[]', '[]', 'Strict analytics registry seed for lead marketplace', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (event_type) DO NOTHING
        SQL
      end
    end
  end

  def down
    if index_exists?(:lead_distributions, %i[lead_id company_id], name: 'index_lead_distributions_on_lead_and_company')
      remove_index :lead_distributions, name: 'index_lead_distributions_on_lead_and_company'
    end
    if index_exists?(:lead_distributions, %i[company_id status sent_at], name: 'index_lead_distributions_on_company_status_sent')
      remove_index :lead_distributions, name: 'index_lead_distributions_on_company_status_sent'
    end

    constraint_exists = false
    if connection.respond_to?(:check_constraints)
      begin
        constraint_exists = connection.check_constraints(:leads).any? do |constraint|
          constraint.name == 'ck_leads_valid_status'
        end
      rescue => e
        Rails.logger.warn("Could not check constraints: #{e.message}")
      end
    end

    if constraint_exists
      remove_check_constraint :leads, name: 'ck_leads_valid_status'
    end

    # Restore the original constraint
    add_check_constraint :leads,
                         "wizard_status IN ('draft', 'pending_otp', 'verified', 'distributed', 'proposal_submitted', 'proposal_processing', 'proposal_sent', 'proposal_failed')",
                         name: 'ck_leads_valid_status'
  end
end
