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

        # 1. Normalizar
        dto = LeadRowNormalizer.call(raw, mapping)
        row.normalized_data = dto.to_h

        # 2. Validar
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

        # 3. Fingerprint de idempotência
        fingerprint = LeadDuplicateDetector.calculate_fingerprint(@company.id, dto)
        row.fingerprint = fingerprint

        # 4. Verificar duplicata
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
            existing_record = dup_result[:record]
            update_existing_record(existing_record, dto, overwrite: true)
            row.status = 'processed'
            row.result_record_type = existing_record.class.name
            row.result_record_id = existing_record.id
            row.save!
            @import.increment!(:duplicate_rows)
            @import.increment!(:updated_rows)
            @import.increment!(:processed_rows)
            return
          else # 'update_blank_fields_only'
            existing_record = dup_result[:record]
            update_existing_record(existing_record, dto, overwrite: false)
            row.status = 'processed'
            row.result_record_type = existing_record.class.name
            row.result_record_id = existing_record.id
            row.save!
            @import.increment!(:duplicate_rows)
            @import.increment!(:updated_rows)
            @import.increment!(:processed_rows)
            return
          end
        end

        # 5. Criar novo Lead via Sales pipeline
        new_lead = create_lead(dto)
        if new_lead.persisted?
          row.status = 'processed'
          row.result_record_type = 'Sales::Opportunity'
          row.result_record_id = new_lead.id
          row.save!
          @import.increment!(:created_rows)
        else
          row.status = 'failed'
          row.errors_json = (row.errors_json || []) + new_lead.errors.full_messages
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
        name = dto.company_name.presence || dto.contact_name || 'Empresa sem Nome'

        acc = ::Sales::Account.where(owner_id: @user.id).find_by('LOWER(name) = ?', name.downcase)
        acc ||= ::Sales::Account.where(company_id: @company.id).find_by('LOWER(name) = ?', name.downcase) if @company.present?
        return acc if acc.present?

        ::Sales::Account.create!(
          name: name,
          owner: @user,
          phone: dto.phone || dto.whatsapp,
          email: dto.email,
          city: dto.city,
          state: dto.state,
          segment: dto.segment,
          website: dto.website,
          source: dto.source.presence || 'importacao_csv'
        )
      end

      def find_or_create_contact(dto, account)
        return nil if dto.contact_name.blank?

        if dto.email.present?
          existing = account.contacts.find_by('LOWER(email) = ?', dto.email.downcase)
          return existing if existing
        end

        names = dto.contact_name.strip.split(/\s+/, 2)
        first_name = names.first
        last_name = names.second.to_s

        existing = account.contacts.find_by('LOWER(first_name) = ? AND LOWER(COALESCE(last_name, \'\')) = ?', first_name.downcase, last_name.downcase)
        return existing if existing

        account.contacts.create!(
          first_name: first_name,
          last_name: last_name.presence,
          email: dto.email,
          phone: dto.phone || dto.whatsapp,
          job_title: dto.job_title,
          user: @user
        )
      end

      # Atualiza um registro existente (Sales::Opportunity ou Sales::Account)
      # com os dados do DTO. Usa os atributos corretos de cada modelo.
      def update_existing_record(record, dto, overwrite:)
        if record.is_a?(::Sales::Opportunity)
          update_opportunity(record, dto, overwrite: overwrite)
        elsif record.is_a?(::Sales::Account)
          update_account(record, dto, overwrite: overwrite)
        end
      end

      def update_opportunity(opportunity, dto, overwrite:)
        attrs = {}
        attrs[:name] = dto.contact_name if dto.contact_name.present? && (overwrite || opportunity.name.blank?)

        opportunity.update!(attrs) if attrs.any?

        # Atualizar o account associado
        account = opportunity.account
        update_account(account, dto, overwrite: overwrite) if account
      end

      def update_account(account, dto, overwrite:)
        attrs = {}
        attrs[:name] = dto.company_name if dto.company_name.present? && (overwrite || account.name.blank?)
        attrs[:phone] = dto.phone if dto.phone.present? && (overwrite || account.phone.blank?)
        attrs[:email] = dto.email if dto.email.present? && (overwrite || account.email.blank?)
        attrs[:city] = dto.city if dto.city.present? && (overwrite || account.city.blank?)
        attrs[:state] = dto.state if dto.state.present? && (overwrite || account.state.blank?)
        attrs[:segment] = dto.segment if dto.segment.present? && (overwrite || account.segment.blank?)

        account.update!(attrs) if attrs.any?
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
