# frozen_string_literal: true

class FixSalesEmailAndOpportunityForeignKeys < ActiveRecord::Migration[7.0]
  def up
    # sales_email_messages -> sales_opportunities
    if foreign_key_exists?(:sales_email_messages, :sales_opportunities)
      remove_foreign_key :sales_email_messages, :sales_opportunities
    end
    add_foreign_key :sales_email_messages, :sales_opportunities, on_delete: :nullify

    # sales_email_messages -> sales_accounts
    if foreign_key_exists?(:sales_email_messages, :sales_accounts)
      remove_foreign_key :sales_email_messages, :sales_accounts
    end
    add_foreign_key :sales_email_messages, :sales_accounts, on_delete: :nullify

    # sales_email_messages -> sales_contacts
    if foreign_key_exists?(:sales_email_messages, :sales_contacts)
      remove_foreign_key :sales_email_messages, :sales_contacts
    end
    add_foreign_key :sales_email_messages, :sales_contacts, on_delete: :nullify

    # sales_founder_inbox_items -> sales_opportunities
    if foreign_key_exists?(:sales_founder_inbox_items, :sales_opportunities)
      remove_foreign_key :sales_founder_inbox_items, :sales_opportunities
    end
    add_foreign_key :sales_founder_inbox_items, :sales_opportunities, on_delete: :nullify

    # sales_founder_inbox_items -> sales_accounts
    if foreign_key_exists?(:sales_founder_inbox_items, :sales_accounts)
      remove_foreign_key :sales_founder_inbox_items, :sales_accounts
    end
    add_foreign_key :sales_founder_inbox_items, :sales_accounts, on_delete: :nullify

    # sales_research_records -> sales_opportunities
    if foreign_key_exists?(:sales_research_records, :sales_opportunities)
      remove_foreign_key :sales_research_records, :sales_opportunities
    end
    add_foreign_key :sales_research_records, :sales_opportunities, on_delete: :nullify

    # sales_research_records -> sales_accounts
    if foreign_key_exists?(:sales_research_records, :sales_accounts)
      remove_foreign_key :sales_research_records, :sales_accounts
    end
    add_foreign_key :sales_research_records, :sales_accounts, on_delete: :nullify

    # sales_research_records -> sales_contacts
    if foreign_key_exists?(:sales_research_records, :sales_contacts)
      remove_foreign_key :sales_research_records, :sales_contacts
    end
    add_foreign_key :sales_research_records, :sales_contacts, on_delete: :nullify

    # sales_email_sequence_enrollments -> sales_opportunities
    if foreign_key_exists?(:sales_email_sequence_enrollments, :sales_opportunities)
      remove_foreign_key :sales_email_sequence_enrollments, :sales_opportunities
    end
    add_foreign_key :sales_email_sequence_enrollments, :sales_opportunities, on_delete: :nullify
  end

  def down
    if foreign_key_exists?(:sales_email_messages, :sales_opportunities)
      remove_foreign_key :sales_email_messages, :sales_opportunities
    end
    add_foreign_key :sales_email_messages, :sales_opportunities

    if foreign_key_exists?(:sales_email_messages, :sales_accounts)
      remove_foreign_key :sales_email_messages, :sales_accounts
    end
    add_foreign_key :sales_email_messages, :sales_accounts

    if foreign_key_exists?(:sales_email_messages, :sales_contacts)
      remove_foreign_key :sales_email_messages, :sales_contacts
    end
    add_foreign_key :sales_email_messages, :sales_contacts

    if foreign_key_exists?(:sales_founder_inbox_items, :sales_opportunities)
      remove_foreign_key :sales_founder_inbox_items, :sales_opportunities
    end
    add_foreign_key :sales_founder_inbox_items, :sales_opportunities

    if foreign_key_exists?(:sales_founder_inbox_items, :sales_accounts)
      remove_foreign_key :sales_founder_inbox_items, :sales_accounts
    end
    add_foreign_key :sales_founder_inbox_items, :sales_accounts

    if foreign_key_exists?(:sales_research_records, :sales_opportunities)
      remove_foreign_key :sales_research_records, :sales_opportunities
    end
    add_foreign_key :sales_research_records, :sales_opportunities

    if foreign_key_exists?(:sales_research_records, :sales_accounts)
      remove_foreign_key :sales_research_records, :sales_accounts
    end
    add_foreign_key :sales_research_records, :sales_accounts

    if foreign_key_exists?(:sales_research_records, :sales_contacts)
      remove_foreign_key :sales_research_records, :sales_contacts
    end
    add_foreign_key :sales_research_records, :sales_contacts

    if foreign_key_exists?(:sales_email_sequence_enrollments, :sales_opportunities)
      remove_foreign_key :sales_email_sequence_enrollments, :sales_opportunities
    end
    add_foreign_key :sales_email_sequence_enrollments, :sales_opportunities
  end
end
