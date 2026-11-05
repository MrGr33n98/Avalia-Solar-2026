# frozen_string_literal: true

# Recovery for databases created from db/schema.rb at 2026_11_05_010000.
#
# The schema snapshot was advanced past the October Sales Inbox / AI Studio
# migrations without containing their columns and tables. When CI runs
# db:schema:load followed by db:migrate, Rails marks those older migrations
# as applied, so their structures are never materialized.
#
# All source migrations below were authored with existence guards. Re-running
# them reconciles a partially loaded schema without dropping existing data.
# Production databases where they have already run remain unchanged.
class ReconcileSalesEmailAndAiSchema < ActiveRecord::Migration[7.0]
  SOURCE_MIGRATIONS = {
    '20261028010000_sales_inbox_opcao_a_foundation.rb' => 'SalesInboxOpcaoAFoundation',
    '20261028210000_add_threading_and_inbound_fields_to_sales_email_messages.rb' =>
      'AddThreadingAndInboundFieldsToSalesEmailMessages',
    '20261029160000_add_settings_to_sales_email_signatures.rb' =>
      'AddSettingsToSalesEmailSignatures',
    '20261029163000_add_read_tracking_to_sales_email_messages.rb' =>
      'AddReadTrackingToSalesEmailMessages',
    '20261029200000_create_sales_ai_studio_tables.rb' => 'CreateSalesAiStudioTables'
  }.freeze

  def up
    # Preserve the original column definitions, defaults, indexes, and FKs.
    # Each source migration contains column_exists? / index_exists? /
    # create_table(if_not_exists:) guards, so repeat execution is safe.
    SOURCE_MIGRATIONS.each do |filename, class_name|
      require Rails.root.join('db', 'migrate', filename).to_s
      Object.const_get(class_name).new.migrate(:up)
    end
  end

  def down
    # Data-bearing CRM tables must never be removed by a rollback of this fix.
    raise ActiveRecord::IrreversibleMigration,
          'Reconciliation retains existing Sales Inbox and AI Studio data'
  end
end
