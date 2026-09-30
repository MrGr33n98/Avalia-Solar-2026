# frozen_string_literal: true

module Analytics
  class PartialBackfillService
    Result = Struct.new(:ok, :dry_run, :processed_days, :updated_days, :report, :error, keyword_init: true)

    def self.call(company_id:, from_day: nil, to_day: nil, dry_run: true)
      new(company_id: company_id, from_day: from_day, to_day: to_day, dry_run: dry_run).call
    end

    def initialize(company_id:, from_day: nil, to_day: nil, dry_run: true)
      @company_id = company_id
      @from_day = from_day ? from_day.to_date : 90.days.ago.to_date
      @to_day = to_day ? to_day.to_date : Date.current
      @dry_run = dry_run != false
    end

    def call
      return Result.new(ok: false, error: 'company_id missing') if @company_id.blank?

      report = []
      processed = 0
      updated = 0

      ActiveRecord::Base.transaction do
        stats_scope = CompanyDailyStat.where(company_id: @company_id, day: @from_day..@to_day).order(:day)

        stats_scope.each do |stat|
          processed += 1
          day = stat.day

          # Fetch raw events for this day
          raw_counts = raw_event_cta_counts_for(day)

          total_before = stat.cta_clicks.to_i
          quote_before = stat.quote_clicks.to_i
          whatsapp_before = stat.whatsapp_clicks.to_i
          email_before = stat.email_clicks.to_i
          phone_before = stat.phone_clicks.to_i
          website_before = stat.website_clicks.to_i

          # Reconstruct dimensions based ONLY on raw evidence
          reconstructed_quote = raw_counts['quote'].to_i
          reconstructed_whatsapp = raw_counts['whatsapp'].to_i
          reconstructed_email = raw_counts['email'].to_i
          reconstructed_phone = raw_counts['phone'].to_i
          reconstructed_website = raw_counts['website'].to_i

          # Use maximum of existing or reconstructed to avoid dropping historical classified stats
          quote_after = [quote_before, reconstructed_quote].max
          whatsapp_after = [whatsapp_before, reconstructed_whatsapp].max
          email_after = [email_before, reconstructed_email].max
          phone_after = [phone_before, reconstructed_phone].max
          website_after = [website_before, reconstructed_website].max

          classified_after = quote_after + whatsapp_after + email_after + phone_after + website_after

          # INVARIANT CHECK 1: Never exceed total cta_clicks
          if classified_after > total_before
            raise "Backfill invariant failure for day #{day}: classified (#{classified_after}) > total (#{total_before})"
          end

          # INVARIANT CHECK 2: Total MUST remain strictly unchanged (NON-ADDITIVE)
          total_after = total_before
          residual_other_after = total_after - classified_after

          has_change = (quote_before != quote_after) ||
                       (whatsapp_before != whatsapp_after) ||
                       (email_before != email_after) ||
                       (phone_before != phone_after) ||
                       (website_before != website_after)

          day_row = {
            day: day,
            total_before: total_before,
            total_after: total_after,
            quote_before: quote_before,
            quote_after: quote_after,
            classified_after: classified_after,
            residual_other_after: residual_other_after,
            changed: has_change
          }

          report << day_row

          if has_change
            updated += 1
            unless @dry_run
              stat.update_columns(
                quote_clicks: quote_after,
                whatsapp_clicks: whatsapp_after,
                email_clicks: email_after,
                phone_clicks: phone_after,
                website_clicks: website_after,
                updated_at: Time.current
              )
            end
          end
        end

        raise ActiveRecord::Rollback if @dry_run
      end

      Result.new(
        ok: true,
        dry_run: @dry_run,
        processed_days: processed,
        updated_days: updated,
        report: report
      )
    rescue StandardError => e
      Result.new(ok: false, dry_run: @dry_run, error: e.message)
    end

    private

    def raw_event_cta_counts_for(day)
      is_pg = ActiveRecord::Base.connection.adapter_name =~ /postgre/i
      cta_expr = is_pg ? "payload->>'cta_type'" : "json_extract(payload, '$.cta_type')"

      start_time = day.in_time_zone('UTC').beginning_of_day
      end_time = day.in_time_zone('UTC').end_of_day

      rows = ActiveRecord::Base.connection.select_all("
        SELECT event_type, #{cta_expr} AS cta_type
        FROM platform_events
        WHERE company_id = #{@company_id}
          AND occurred_at >= '#{start_time.iso8601}' AND occurred_at <= '#{end_time.iso8601}'
          AND (event_type LIKE '%cta%' OR #{cta_expr} IS NOT NULL)
      ")

      counts = Hash.new(0)
      rows.each do |row|
        event_type = row['event_type']
        raw_cta_type = row['cta_type']
        canonical_cta = Analytics::EventTaxonomy.cta_type(event_type, { 'cta_type' => raw_cta_type })
        counts[canonical_cta] += 1 if canonical_cta.present?
      end

      counts
    end
  end
end
