# frozen_string_literal: true

require 'csv'

module Sales
  module Contacts
    class ImportService
      MAX_FILE_SIZE = 10.megabytes
      MAX_ROWS = 50_000
      MAX_COLS = 50
      MAX_CELL_LENGTH = 500

      DEFAULT_HEADER_MAP = {
        'first_name' => %w[first_name firstname nome primeiro_nome name],
        'last_name' => %w[last_name lastname sobrenome ultimo_nome],
        'email' => %w[email e-mail correio_eletronico],
        'phone' => %w[phone telefone celular mobile wpp whatsapp],
        'job_title' => %w[job_title jobtitle cargo funcao position],
        'company' => %w[company empresa account razao_social],
        'city' => %w[city cidade],
        'state' => %w[state estado uf],
        'tags' => %w[tags tag etiquetas]
      }.freeze

      def self.call(import:)
        new(import: import).call
      end

      def initialize(import:)
        @import = import
        @company = import.company
        @user = import.user
      end

      def call
        @import.reload
        if @import.status == 'cancelled'
          Rails.logger.info("[ContactImport] Import #{@import.id} was cancelled before execution.")
          return @import
        end

        @import.update!(status: 'importing', started_at: Time.current)

        unless @import.file.attached?
          @import.update!(status: 'failed', error_summary_jsonb: { error: 'Nenhum arquivo anexado para importação.', details: { blockers: [{ code: 'MISSING_FILE', message: 'Nenhum arquivo anexado.' }] } })
          return @import
        end

        if @import.file.blob.byte_size > MAX_FILE_SIZE
          @import.update!(status: 'failed', error_summary_jsonb: { error: 'Arquivo excede o tamanho máximo de 10MB.', details: { blockers: [{ code: 'FILE_TOO_LARGE', message: 'Tamanho excede 10MB.' }] } })
          return @import
        end

        file_content = @import.file.download
        filename = @import.filename.to_s.downcase

        unless filename.end_with?('.csv') || @import.file.blob.content_type.to_s.include?('csv') || @import.file.blob.content_type.to_s.include?('plain')
          @import.update!(status: 'failed', error_summary_jsonb: { error: 'Apenas arquivos formato CSV são suportados.', details: { blockers: [{ code: 'UNSUPPORTED_FORMAT', message: 'Formato não suportado. Utilize CSV.' }] } })
          return @import
        end

        mapping = @import.mapping_jsonb.presence || suggest_mapping_from_content(file_content)
        options = @import.options_jsonb || {}
        target_list_id = options['target_list_id']
        tag_names = Array(options['tags']).compact.map(&:to_s).map(&:strip).reject(&:empty?)
        dedup_policy = options['dedup_policy'] || 'update'
        create_missing_accounts = Boolean(options['create_missing_accounts'])

        target_list = target_list_id.present? ? ::Sales::ContactList.find_by(id: target_list_id, company_id: @company.id) : nil

        processed = 0
        valid = 0
        invalid = 0
        duplicates = 0
        imported = 0
        failed = 0

        created_contacts_for_list = []

        # Ensure valid UTF-8 encoding, strip BOM if present and normalize line endings
        raw_utf8 = file_content.to_s.force_encoding('UTF-8')
        clean_utf8 = raw_utf8.sub("\xEF\xBB\xBF", '')
        clean_utf8 = clean_utf8.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        clean_utf8 = clean_utf8.gsub("\r\n", "\n").gsub("\r", "\n")

        CSV.parse(clean_utf8, headers: true) do |row|
          processed += 1
          if processed > MAX_ROWS
            Rails.logger.warn("[ContactImport] Import #{@import.id} capped at #{MAX_ROWS} rows.")
            break
          end

          # Periodically check cancellation every 100 rows
          if processed % 100 == 0
            @import.reload
            if @import.status == 'cancelled'
              Rails.logger.info("[ContactImport] Import #{@import.id} cancelled at row #{processed}.")
              return @import
            end
          end

          data = extract_fields(row, mapping)
          raw_email = data[:email].to_s.strip.downcase

          if raw_email.blank? || !valid_email?(raw_email)
            invalid += 1
            next
          end

          # Tenant-scoped case-insensitive email lookup (P0-6)
          existing = ::Sales::Contact.where(company_id: @company.id).where('LOWER(email) = ?', raw_email).first

          # Account matching (P0-7)
          account_id = nil
          if data[:company].present?
            acc_name = data[:company].strip
            matched_account = ::Sales::Account.where(company_id: @company.id).where('LOWER(name) = ?', acc_name.downcase).first
            if matched_account
              account_id = matched_account.id
            elsif create_missing_accounts
              created_account = ::Sales::Account.create!(company_id: @company.id, name: acc_name, user_id: @user.id)
              account_id = created_account.id
            end
          end

          if existing
            duplicates += 1
            if dedup_policy == 'update'
              update_contact_fields(existing, data, account_id)
            end
            contact = existing
          else
            first_name = data[:first_name].presence || raw_email.split('@').first.capitalize
            contact = ::Sales::Contact.create!(
              company_id: @company.id,
              user_id: @user.id,
              sales_account_id: account_id,
              email: raw_email,
              first_name: truncate_cell(first_name),
              last_name: truncate_cell(data[:last_name]),
              phone: truncate_cell(data[:phone]),
              job_title: truncate_cell(data[:job_title]),
              city: truncate_cell(data[:city]),
              state: truncate_cell(data[:state]),
              source: 'csv_import'
            )
            imported += 1
          end

          valid += 1
          created_contacts_for_list << contact.id

          if tag_names.any?
            apply_tags(contact, tag_names)
          end
        rescue StandardError => e
          failed += 1
          Rails.logger.error("[ContactImport] Row #{processed} error: #{e.message}")
        end

        # Batch insert list memberships (P0-8)
        if target_list && created_contacts_for_list.any?
          memberships_data = created_contacts_for_list.uniq.map do |cid|
            {
              company_id: @company.id,
              sales_contact_list_id: target_list.id,
              sales_contact_id: cid,
              source: 'import',
              created_at: Time.current
            }
          end
          ::Sales::ContactListMembership.insert_all(memberships_data, unique_by: :idx_sales_contact_list_memberships_unique)
          target_list.reload.update_column(:contacts_count, target_list.memberships.count)
        end

        @import.update!(
          status: 'completed',
          total_rows: processed,
          valid_rows: valid,
          invalid_rows: invalid,
          duplicate_rows: duplicates,
          imported_rows: imported,
          failed_rows: failed,
          completed_at: Time.current
        )

        @import
      rescue StandardError => e
        @import.update!(status: 'failed', error_summary_jsonb: { error: e.message, details: { blockers: [{ code: 'IMPORT_FAILED', message: e.message }] } })
        raise e
      end

      def suggest_mapping_from_content(content)
        headers = []
        CSV.parse(content, headers: false) do |row|
          headers = row.map(&:to_s)
          break
        end
        suggest_mapping_from_headers(headers)
      end

      def suggest_mapping_from_headers(headers)
        mapping = {}
        headers.first(MAX_COLS).each do |h|
          norm = h.to_s.strip.downcase.gsub(/\s+/, '_')
          matched = DEFAULT_HEADER_MAP.find { |_field, aliases| aliases.include?(norm) }
          mapping[h] = matched ? matched.first : 'ignore'
        end
        mapping
      end

      private

      def extract_fields(row, mapping)
        res = {}
        mapping.each do |csv_col, crm_field|
          next if crm_field == 'ignore' || crm_field.blank?

          cell_val = row[csv_col] || row[csv_col.to_s]
          res[crm_field.to_sym] = truncate_cell(cell_val.to_s.strip)
        end
        res
      end

      def truncate_cell(val)
        return nil if val.blank?

        val.to_s[0, MAX_CELL_LENGTH]
      end

      def valid_email?(email)
        email.match?(URI::MailTo::EMAIL_REGEXP)
      end

      def update_contact_fields(contact, data, account_id)
        updates = {}
        updates[:sales_account_id] = account_id if account_id.present? && contact.sales_account_id.blank?
        updates[:phone] = data[:phone] if data[:phone].present? && contact.phone.blank?
        updates[:job_title] = data[:job_title] if data[:job_title].present? && contact.job_title.blank?
        updates[:city] = data[:city] if data[:city].present? && contact.city.blank?
        updates[:state] = data[:state] if data[:state].present? && contact.state.blank?
        contact.update!(updates) if updates.any?
      end

      def apply_tags(contact, tag_names)
        tag_names.each do |tname|
          tag = ::Sales::Tag.find_or_create_by!(company_id: @company.id, name: tname)
          contact.taggings.find_or_create_by!(company_id: @company.id, tag: tag)
        end
      end
    end
  end
end
