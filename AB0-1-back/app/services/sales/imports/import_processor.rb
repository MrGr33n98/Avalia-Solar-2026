# frozen_string_literal: true

module Sales
  module Imports
    class ImportProcessor
      BATCH_SIZE = 500

      def self.call(import)
        new(import).process
      end

      def initialize(import)
        @import = import
        @company = import.company
        @user = import.user
        @options = (import.options || {}).symbolize_keys
      end

      def process
        return if @import.status_completed? || @import.status_processing?

        @import.update!(
          status: 'processing',
          started_at: Time.current,
          processed_rows: 0,
          created_rows: 0,
          updated_rows: 0,
          duplicate_rows: 0,
          invalid_rows: 0,
          skipped_rows: 0
        )

        duplicate_option = @options[:duplicate_strategy] || 'update_blank_fields_only'

        @import.rows.find_in_batches(batch_size: BATCH_SIZE) do |batch|
          ActiveRecord::Base.transaction do
            batch.each do |row|
              process_row(row, duplicate_option)
            end
          end
        end

        has_errors = @import.invalid_rows > 0 || @import.rows.where(status: 'failed').exists?
        final_status = has_errors ? 'completed_with_errors' : 'completed'

        @import.update!(
          status: final_status,
          completed_at: Time.current
        )

        track_audit_log(final_status)
      rescue StandardError => e
        Rails.logger.error("[Sales::Imports::ImportProcessor] Fatal failure: #{e.message}\n#{e.backtrace.first(5).join("\n")}")
        @import.update!(
          status: 'failed',
          error_summary: { fatal_error: e.message }
        )
      end

      private

      def process_row(row, duplicate_option)
        raw = row.raw_data || {}
        mapping = @import.mapping || {}

        # 1. Normalize
        dto = LeadRowNormalizer.call(raw, mapping)
        row.normalized_data = dto.to_h

        # 2. Validate
        val_result = LeadRowValidator.call(dto, company: @company)
        row.errors_json = val_result[:errors]
        row.warnings_json = val_result[:warnings]

        unless val_result[:valid]
          row.status = 'invalid'
          row.save!
          @import.increment!(:invalid_rows)
          @import.increment!(:processed_rows)
          return
        end

        # 3. Idempotency fingerprint
        fingerprint = LeadDuplicateDetector.calculate_fingerprint(@company.id, dto)
        row.fingerprint = fingerprint

        # 4. Check duplicate
        dup_result = LeadDuplicateDetector.call(dto, company: @company)

        if dup_result.present?
          row.duplicate_type = dup_result[:duplicate_type]
          row.duplicate_record_type = dup_result[:record].class.name
          row.duplicate_record_id = dup_result[:record].id

          case duplicate_option.to_s
          when 'skip_duplicates'
            row.status = 'skipped'
            row.save!
            @import.increment!(:duplicate_rows)
            @import.increment!(:skipped_rows)
            @import.increment!(:processed_rows)
            return
          when 'overwrite_all'
            existing_lead = dup_result[:record]
            update_lead(existing_lead, dto, overwrite: true)
            row.status = 'processed'
            row.result_record_type = 'Lead'
            row.result_record_id = existing_lead.id
            row.save!
            @import.increment!(:duplicate_rows)
            @import.increment!(:updated_rows)
            @import.increment!(:processed_rows)
            return
          else # 'update_blank_fields_only'
            existing_lead = dup_result[:record]
            update_lead(existing_lead, dto, overwrite: false)
            row.status = 'processed'
            row.result_record_type = 'Lead'
            row.result_record_id = existing_lead.id
            row.save!
            @import.increment!(:duplicate_rows)
            @import.increment!(:updated_rows)
            @import.increment!(:processed_rows)
            return
          end
        end

        # 5. Create new Lead
        new_lead = create_lead(dto)
        if new_lead.persisted?
          row.status = 'processed'
          row.result_record_type = 'Lead'
          row.result_record_id = new_lead.id
          row.save!
          @import.increment!(:created_rows)
        else
          row.status = 'failed'
          row.errors_json = row.errors_json + new_lead.errors.full_messages
          row.save!
          @import.increment!(:invalid_rows)
        end

        @import.increment!(:processed_rows)
      rescue StandardError => e
        row.status = 'failed'
        row.errors_json = (row.errors_json || []) + [e.message]
        row.save!
        @import.increment!(:invalid_rows)
        @import.increment!(:processed_rows)
      end

      def create_lead(dto)
        account = find_or_create_account(dto)
        contact = find_or_create_contact(dto, account)
        result = ::Sales::Leads::Create.call(
          actor: @user,
          attributes: {
            name: dto.contact_name.presence || dto.company_name,
            sales_account_id: account.id,
            primary_contact_id: contact&.id,
            stage_key: dto.stage_identifier,
            value_cents: dto.estimated_value.present? ? (dto.estimated_value.to_f * 100).round : nil,
            contact_ids: contact ? [contact.id] : []
          }
        )
        raise StandardError, result.message unless result.success?

        result.lead
      end

      def find_or_create_account(dto)
        name = dto.company_name.presence || dto.contact_name
        ::Sales::Account.where(company_id: @company.id).find_or_create_by!(name: name) do |account|
          account.owner = @user
        end
      end

      def find_or_create_contact(dto, account)
        return if dto.contact_name.blank?

        existing = account.contacts.find_by("LOWER(first_name) = ?", dto.contact_name.downcase)
        return existing if existing

        names = dto.contact_name.split(/\s+/, 2)
        account.contacts.create!(
          first_name: names.first,
          last_name: names.second,
          email: dto.email,
          phone: dto.phone || dto.whatsapp,
          job_title: dto.job_title,
          user: @user
        )
      end

      def update_lead(lead, dto, overwrite:)
        attrs = {}
        attrs[:name] = dto.contact_name if dto.contact_name.present? && (overwrite || lead.name.blank?)
        attrs[:company] = dto.company_name if dto.company_name.present? && (overwrite || lead.company.blank?)
        attrs[:email] = dto.email if dto.email.present? && (overwrite || lead.email.blank?)
        attrs[:phone] = (dto.phone || dto.whatsapp) if (dto.phone || dto.whatsapp).present? && (overwrite || lead.phone.blank?)
        attrs[:state] = dto.state if dto.state.present? && (overwrite || lead.state.blank?)
        attrs[:city] = dto.city if dto.city.present? && (overwrite || lead.city.blank?)

        lead.update!(attrs) if attrs.any?
      end

      def track_audit_log(final_status)
        if defined?(AuditLog) && AuditLog.respond_to?(:create!)
          AuditLog.create!(
            company: @company,
            user: @user,
            action: "sales.import.#{final_status}",
            auditable: @import,
            metadata: {
              filename: @import.filename,
              total_rows: @import.total_rows,
              created_rows: @import.created_rows,
              updated_rows: @import.updated_rows,
              invalid_rows: @import.invalid_rows
            }
          )
        end
      rescue StandardError => e
        Rails.logger.warn("[ImportProcessor] Audit log error: #{e.message}")
      end
    end
  end
end
