# frozen_string_literal: true

class CreateSalesEmailSequenceEnrollments < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_email_sequence_enrollments do |t|
      t.references :company, null: false, foreign_key: true,
                             index: { name: 'idx_sales_seq_enroll_company' }
      t.references :sales_email_sequence, null: false, foreign_key: { to_table: :sales_email_sequences },
                                          index: { name: 'idx_sales_seq_enroll_sequence' }
      t.references :sales_contact, null: false, foreign_key: { to_table: :sales_contacts },
                                   index: { name: 'idx_sales_seq_enroll_contact' }
      t.references :sales_account, null: false, foreign_key: { to_table: :sales_accounts },
                                   index: { name: 'idx_sales_seq_enroll_account' }
      t.references :sales_opportunity, foreign_key: { to_table: :sales_opportunities },
                                       index: { name: 'idx_sales_seq_enroll_opportunity' }
      t.references :owner, null: false, foreign_key: { to_table: :users },
                           index: { name: 'idx_sales_seq_enroll_owner' }
      t.string :status, null: false, default: 'active'
      t.integer :current_step, null: false, default: 0
      t.datetime :enrolled_at, null: false
      t.datetime :next_action_at
      t.datetime :paused_at
      t.datetime :stopped_at
      t.string :stop_reason
      t.datetime :completed_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :sales_email_sequence_enrollments,
              %i[sales_email_sequence_id sales_contact_id],
              unique: true,
              where: "status IN ('active', 'paused')",
              name: 'idx_sales_sequence_enrollments_active_contact'
    add_index :sales_email_sequence_enrollments,
              %i[company_id status next_action_at],
              name: 'idx_sales_sequence_enrollments_due'

    create_table :sales_email_sequence_enrollment_steps do |t|
      t.references :company, null: false, foreign_key: true,
                             index: { name: 'idx_sales_seq_enrollment_steps_company' }
      t.references :sales_email_sequence_enrollment, null: false,
                                                     foreign_key: { on_delete: :cascade },
                                                     index: { name: 'idx_sales_seq_enrollment_steps_enrollment' }
      t.references :sales_email_sequence_step, null: false,
                                               foreign_key: { to_table: :sales_email_sequence_steps },
                                               index: { name: 'idx_sales_seq_enrollment_steps_definition' }
      t.integer :position, null: false
      t.string :status, null: false, default: 'queued'
      t.integer :attempt_count, null: false, default: 0
      t.datetime :next_attempt_at
      t.datetime :completed_at
      t.string :error_code
      t.timestamps
    end

    add_index :sales_email_sequence_enrollment_steps,
              %i[sales_email_sequence_enrollment_id sales_email_sequence_step_id],
              unique: true,
              name: 'idx_sales_sequence_enrollment_step_unique'
    add_index :sales_email_sequence_enrollment_steps,
              %i[company_id status next_attempt_at],
              name: 'idx_sales_sequence_enrollment_steps_pending'

    add_reference :sales_email_messages, :sales_email_sequence_enrollment_step,
                  foreign_key: { on_delete: :nullify }, index: false
    add_index :sales_email_messages, :sales_email_sequence_enrollment_step_id,
              unique: true, where: 'sales_email_sequence_enrollment_step_id IS NOT NULL',
              name: 'idx_sales_email_messages_sequence_step_unique'

    add_reference :sales_tasks, :sales_email_sequence_enrollment_step,
                  foreign_key: { on_delete: :nullify }, index: false
    add_index :sales_tasks, :sales_email_sequence_enrollment_step_id,
              unique: true, where: 'sales_email_sequence_enrollment_step_id IS NOT NULL',
              name: 'idx_sales_tasks_sequence_step_unique'
  end
end
