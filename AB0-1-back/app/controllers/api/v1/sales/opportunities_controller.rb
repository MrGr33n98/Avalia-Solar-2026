# frozen_string_literal: true

module Api
  module V1
    module Sales
      class OpportunitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity, only: %i[show update destroy timeline]

        def index
          scope = scoped_opportunities.merge(::Sales::OpportunitiesQuery.call(params)).includes(:account, :stage, :primary_contact, :owner, :tags)
          page = [params[:page].to_i, 1].max
          per_page = [[params[:per_page].to_i, 50].max, 100].min
          total = scope.count
          opportunities = scope.offset((page - 1) * per_page).limit(per_page)
          totals = scope.unscope(:select, :order, :limit, :offset).pick(
            Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)'),
            Arel.sql('COUNT(sales_opportunities.id)')
          )
          render json: {
            opportunities: opportunities.map { |o| opportunity_json(o) },
            meta: { page: page, per_page: per_page, total: total, pages: (total.to_f / per_page).ceil },
            totals: { value_cents: totals&.first.to_i, count: totals&.last.to_i }
          }
        end

        def analytics
          query_params = params.to_unsafe_h.symbolize_keys
          query_params[:all_statuses] = true if query_params[:status].blank? && query_params[:status_in].blank?
          scope = scoped_opportunities.merge(::Sales::OpportunitiesQuery.call(query_params)).unscope(:order)

          total_leads = scope.count
          total_value_cents = scope.sum(:value_cents) || 0
          avg_value_cents = total_leads.positive? ? (total_value_cents.to_f / total_leads).round : 0

          avg_time_open_sql = Arel.sql('COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(sales_opportunities.won_at, sales_opportunities.lost_at, CURRENT_TIMESTAMP) - sales_opportunities.created_at)) / 86400.0), 0.0)')
          avg_time_open_days = scope.pick(avg_time_open_sql).to_f.round(1)

          status_counts = scope.group(:status).count
          won_count = status_counts['won'].to_i
          lost_count = status_counts['lost'].to_i
          open_count = status_counts['open'].to_i
          closed_count = won_count + lost_count
          win_rate_percentage = closed_count.positive? ? ((won_count.to_f / closed_count) * 100).round(1) : 0.0

          date_col = params[:date_field] == 'close_date' ? 'COALESCE(sales_opportunities.won_at, sales_opportunities.lost_at, sales_opportunities.expected_close_date::timestamp)' : 'sales_opportunities.created_at'
          group_trunc = params[:group_by] == 'month' ? 'month' : 'week'

          time_series_rows = scope.where("#{date_col} IS NOT NULL")
                                  .group(Arel.sql("DATE_TRUNC('#{group_trunc}', #{date_col})"))
                                  .order(Arel.sql("DATE_TRUNC('#{group_trunc}', #{date_col}) ASC"))
                                  .pluck(
                                    Arel.sql("DATE_TRUNC('#{group_trunc}', #{date_col})"),
                                    Arel.sql('COUNT(sales_opportunities.id)'),
                                    Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)')
                                  )

          months_pt = %w[jan fev mar abr mai jun jul ago set out nov dez]
          time_series = time_series_rows.map do |date_val, qty, val_cents|
            d = date_val.is_a?(Time) || date_val.is_a?(DateTime) ? date_val.to_date : Date.parse(date_val.to_s)
            label = if group_trunc == 'month'
                      "#{months_pt[d.month - 1]} #{d.strftime('%y')}"
                    else
                      "#{d.strftime('%d/%m')}"
                    end
            {
              period_label: label,
              start_date: d.to_s,
              quantity: qty.to_i,
              value_cents: val_cents.to_i
            }
          end

          calc_pct = ->(c) { total_leads.positive? ? ((c.to_f / total_leads) * 100).round(1) : 0.0 }
          safe_calc = ->(fallback = []) do
            begin
              yield
            rescue => e
              Rails.logger.error("[SALES_ANALYTICS_BREAKDOWN_ERROR] #{e.class}: #{e.message}")
              fallback
            end
          end

          assignee_data = safe_calc.call([]) do
            scope.joins('LEFT JOIN users ON users.id = sales_opportunities.owner_id')
                 .group('users.id', 'users.name', 'users.email')
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck('users.id', 'users.name', 'users.email', Arel.sql('COUNT(sales_opportunities.id)'))
                 .map do |uid, uname, em, c|
                   display_name = uname.presence || em.presence || 'Sem responsável'
                   { id: uid, label: display_name, count: c.to_i, percentage: calc_pct.call(c) }
                 end
          end

          stage_data = safe_calc.call([]) do
            scope.joins(:stage)
                 .group('sales_stages.id', 'sales_stages.name', 'sales_stages.position')
                 .order('sales_stages.position ASC')
                 .pluck('sales_stages.id', 'sales_stages.name', Arel.sql('COUNT(sales_opportunities.id)'))
                 .map do |sid, sname, c|
                   { id: sid, label: sname, count: c.to_i, percentage: calc_pct.call(c) }
                 end
          end

          product_data = safe_calc.call([]) do
            scope.joins('INNER JOIN sales_opportunity_line_items ON sales_opportunity_line_items.opportunity_id = sales_opportunities.id INNER JOIN sales_products ON sales_products.id = sales_opportunity_line_items.product_id')
                 .group('sales_products.id', 'sales_products.name')
                 .order(Arel.sql('COUNT(DISTINCT sales_opportunities.id) DESC'))
                 .pluck('sales_products.id', 'sales_products.name', Arel.sql('COUNT(DISTINCT sales_opportunities.id)'))
                 .map { |pid, pname, c| { id: pid, label: pname, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          outcome_data = [
            { status: 'won', label: 'Won', count: won_count, percentage: calc_pct.call(won_count), color: '#16A34A' },
            { status: 'open', label: 'Open', count: open_count, percentage: calc_pct.call(open_count), color: '#334155' },
            { status: 'lost', label: 'Lost', count: lost_count, percentage: calc_pct.call(lost_count), color: '#DC2626' }
          ]

          source_data = safe_calc.call([]) do
            scope.joins('LEFT JOIN sales_sources ON sales_sources.id = sales_opportunities.source_id')
                 .group(Arel.sql("COALESCE(sales_sources.name, sales_opportunities.source, 'Não informado')"))
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck(Arel.sql("COALESCE(sales_sources.name, sales_opportunities.source, 'Não informado')"), Arel.sql('COUNT(sales_opportunities.id)'))
                 .map { |src, c| { label: src, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          competitor_data = safe_calc.call([]) do
            scope.joins(:competitors)
                 .group('sales_competitors.id', 'sales_competitors.name')
                 .order(Arel.sql('COUNT(DISTINCT sales_opportunities.id) DESC'))
                 .pluck('sales_competitors.id', 'sales_competitors.name', Arel.sql('COUNT(DISTINCT sales_opportunities.id)'))
                 .map { |cid, cname, c| { id: cid, label: cname, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          tag_data = safe_calc.call([]) do
            scope.joins(:tags)
                 .group('sales_tags.id', 'sales_tags.name')
                 .order(Arel.sql('COUNT(DISTINCT sales_opportunities.id) DESC'))
                 .pluck('sales_tags.id', 'sales_tags.name', Arel.sql('COUNT(DISTINCT sales_opportunities.id)'))
                 .map { |tid, tname, c| { id: tid, label: tname, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          territory_data = safe_calc.call([]) do
            scope.joins(:account)
                 .where.not(sales_accounts: { state: [nil, ''] })
                 .group('sales_accounts.state')
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck('sales_accounts.state', Arel.sql('COUNT(sales_opportunities.id)'))
                 .map { |st, c| { label: st.upcase, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          age_sql = <<-SQL.squish
            CASE
              WHEN CURRENT_DATE - sales_opportunities.created_at::date <= 30 THEN '< 1 month'
              WHEN CURRENT_DATE - sales_opportunities.created_at::date <= 60 THEN '1-2 months'
              WHEN CURRENT_DATE - sales_opportunities.created_at::date <= 90 THEN '2-3 months'
              ELSE '> 3 months'
            END
          SQL
          age_data = safe_calc.call([]) do
            scope.group(Arel.sql(age_sql))
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck(Arel.sql(age_sql), Arel.sql('COUNT(sales_opportunities.id)'))
                 .map { |bucket, c| { label: bucket, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          val_sql = <<-SQL.squish
            CASE
              WHEN sales_opportunities.value_cents <= 1000000 THEN 'R$ 0 - 10k'
              WHEN sales_opportunities.value_cents <= 2500000 THEN 'R$ 10k - 25k'
              WHEN sales_opportunities.value_cents <= 5000000 THEN 'R$ 25k - 50k'
              WHEN sales_opportunities.value_cents <= 7500000 THEN 'R$ 50k - 75k'
              ELSE 'R$ 75k+'
            END
          SQL
          value_data = safe_calc.call([]) do
            scope.group(Arel.sql(val_sql))
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck(Arel.sql(val_sql), Arel.sql('COUNT(sales_opportunities.id)'))
                 .map { |vbucket, c| { label: vbucket, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          channel_sql = "COALESCE(sales_opportunities.metadata->>'channel', sales_opportunities.metadata->>'utm_medium', sales_opportunities.metadata->>'acquisition_channel', sales_sources.name, sales_opportunities.source, 'Direct')"
          channel_data = safe_calc.call([]) do
            scope.joins('LEFT JOIN sales_sources ON sales_sources.id = sales_opportunities.source_id')
                 .group(Arel.sql(channel_sql))
                 .order(Arel.sql('COUNT(sales_opportunities.id) DESC'))
                 .pluck(Arel.sql(channel_sql), Arel.sql('COUNT(sales_opportunities.id)'))
                 .map { |ch, c| { label: ch, count: c.to_i, percentage: calc_pct.call(c) } }
          end

          render json: {
            summary: {
              total_leads: total_leads,
              total_value_cents: total_value_cents,
              total_value_formatted: format_currency_brl(total_value_cents),
              avg_value_cents: avg_value_cents,
              avg_value_formatted: format_currency_brl(avg_value_cents),
              avg_time_open_days: avg_time_open_days,
              win_rate_percentage: win_rate_percentage
            },
            time_series: time_series,
            breakdowns: {
              assignee: assignee_data,
              stage: stage_data,
              product: product_data,
              outcome: outcome_data,
              source: source_data,
              competitor: competitor_data,
              tag: tag_data,
              territory: territory_data,
              age: age_data,
              value_bracket: value_data,
              channel: channel_data
            }
          }
        rescue => e
          Rails.logger.error("[SALES_ANALYTICS_FATAL] #{e.class}: #{e.message}\n#{e.backtrace.first(15).join("\n")}")
          render json: {
            summary: {
              total_leads: 0,
              total_value_cents: 0,
              total_value_formatted: 'R$ 0,00',
              avg_value_cents: 0,
              avg_value_formatted: 'R$ 0,00',
              avg_time_open_days: 0.0,
              win_rate_percentage: 0.0
            },
            time_series: [],
            breakdowns: {
              assignee: [],
              stage: [],
              product: [],
              outcome: [],
              source: [],
              competitor: [],
              tag: [],
              territory: [],
              age: [],
              value_bracket: [],
              channel: []
            },
            error: {
              code: 'ANALYTICS_UNAVAILABLE',
              message: 'Estatísticas temporariamente indisponíveis'
            }
          }, status: :ok
        end

        def show
          render json: { opportunity: opportunity_json(@opportunity) }
        end

        def destroy
          @opportunity.destroy!
          ::Sales::AuditRecorder.call(record: @opportunity, action: 'deleted', actor: current_user,
                                      request_id: request.request_id, ip: request.remote_ip) rescue nil
          render json: { message: 'Oportunidade excluída com sucesso', id: @opportunity.id }
        end

        def bulk
          ids = Array(params[:ids]).filter_map { |id| Integer(id, exception: false) }.uniq
          return render_error_response(message: 'Selecione ao menos um Lead.', status: :unprocessable_entity, code: 'BULK_EMPTY') if ids.empty?
          return render_error_response(message: 'Limite de 100 Leads por operação.', status: :unprocessable_entity, code: 'BULK_LIMIT') if ids.size > 100

          updated = ActiveRecord::Base.transaction do
            records = scoped_opportunities.includes(pipeline: :stages).where(id: ids).lock.to_a
            raise ActiveRecord::RecordNotFound if records.size != ids.size
            records.each { |record| apply_bulk_action(record) }
            records
          end
          render json: { updated_ids: updated.map(&:id), count: updated.size }
        rescue ActiveRecord::RecordNotFound
          render_error_response(message: 'Lead não encontrado ou sem permissão.', status: :not_found, code: 'LEAD_NOT_FOUND')
        rescue ActiveRecord::RecordInvalid, ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'BULK_INVALID')
        end

        def timeline
          after = params[:after].presence
          return render_error_response(message: 'Cursor inválido.', status: :unprocessable_entity, code: 'INVALID_CURSOR') if after && !after.match?(/\A\d+\z/)

          result = ::Sales::Timeline::Query.new(opportunity: @opportunity, user: current_user, after: after).call
          render json: result
        end

        def create
          result = ::Sales::Opportunities::Create.call(
            actor: current_user,
            attributes: opportunity_create_params.merge(stage_key: params.dig(:opportunity, :stage_key)),
            inline_account: params[:account] || params.dig(:opportunity, :account),
            inline_contact: params[:contact] || params.dig(:opportunity, :contact)
          )

          if result.success?
            render json: { opportunity: opportunity_json(result.opportunity) }, status: :created
          else
            render json: {
              error: {
                code: result.code,
                message: result.message,
                fields: result.fields,
                request_id: request.request_id
              }
            }, status: :unprocessable_entity
          end
        end

        def update
          attrs = opportunity_update_params.to_h.symbolize_keys
          account_id = attrs[:sales_account_id].presence || @opportunity.sales_account_id
          account = current_tenant_scope.accounts.find_by(id: account_id)
          unless account
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          contact_id = attrs.key?(:primary_contact_id) ? attrs[:primary_contact_id] : @opportunity.primary_contact_id
          contact = current_tenant_scope.contacts.find_by(id: contact_id) if contact_id.present?
          if contact_id.present? && contact.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end
          return render_relation_conflict(resource: 'Opportunity') unless current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: @opportunity)

          ActiveRecord::Base.transaction do
            if params.dig(:opportunity, :stage_key).present? || params.dig(:opportunity, :sales_stage_id).present?
              stage = if params.dig(:opportunity, :stage_key).present?
                        @opportunity.pipeline.stages.find_by(key: params[:opportunity][:stage_key]) ||
                          @opportunity.pipeline.stages.find_by(name: params[:opportunity][:stage_key])
                      else
                        @opportunity.pipeline.stages.find_by(id: params[:opportunity][:sales_stage_id])
                      end
              raise ActiveRecord::RecordNotFound, 'Estágio não pertence ao pipeline da oportunidade.' if stage.nil?

              ::Sales::Opportunities::ChangeStage.call(opportunity: @opportunity, stage:, actor: current_user)
            else
              @opportunity.update!(attrs)
            end
          end
          render json: { opportunity: opportunity_json(@opportunity.reload) }
        rescue ActiveRecord::RecordNotFound => e
          render_error_response(message: 'Estágio não pertence ao pipeline da oportunidade.', status: :unprocessable_entity, code: 'STAGE_NOT_FOUND')
        rescue ArgumentError => e
          render_error_response(message: e.message, status: :unprocessable_entity, code: 'INVALID_STAGE_TRANSITION')
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
              fields: e.record.errors.messages
            }
          }, status: :unprocessable_entity
        end

        private

        def scoped_opportunities
          ::Sales::TenantScope.for(current_user).opportunities
        end

        def apply_bulk_action(record)
          case params[:action].to_s
          when 'status'
            record.update!(status: params[:value].to_s)
          when 'owner'
            new_owner_id = Integer(params[:value])
            target_user = User.find_by(id: new_owner_id)
            raise ActiveRecord::RecordNotFound unless current_tenant_scope.valid_owner?(target_user, account: record.account)
            record.update!(owner_id: new_owner_id)
          when 'remove_tag'
            tag_scope = current_user.admin? ? ::Sales::Tag.all : ::Sales::Tag.where(company_id: current_user.company_id)
            tag = tag_scope.find(params[:value])
            raise ActiveRecord::RecordNotFound unless tag.entity_type == 'Opportunity'
            record.taggings.where(sales_tag_id: tag.id).delete_all
          when 'tag'
            tag_scope = current_user.admin? ? ::Sales::Tag.all : ::Sales::Tag.where(company_id: current_user.company_id)
            tag = tag_scope.active.find(params[:value])
            raise ActiveRecord::RecordNotFound unless tag.entity_type == 'Opportunity'
            record.taggings.create_or_find_by!(sales_tag_id: tag.id, created_by: current_user)
          when 'stage'
            stage = record.pipeline.stages.to_a.find { |candidate| candidate.id == Integer(params[:value], exception: false) || candidate.key == params[:value].to_s }
            raise ActiveRecord::RecordNotFound if stage.nil?
            ::Sales::Opportunities::ChangeStage.call(opportunity: record, stage: stage, actor: current_user)
          else
            raise ArgumentError, 'Ação em massa inválida.'
          end
        end

        def set_opportunity
          @opportunity = scoped_opportunities.includes(:account, :stage, :primary_contact, :pipeline, :tags).find(params[:id])
        end

        def resolve_pipeline
          pipeline = if params.dig(:opportunity, :sales_pipeline_id).present?
                       ::Sales::Pipeline.find_by(id: params[:opportunity][:sales_pipeline_id])
                     end
          pipeline ||= ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first

          if pipeline.nil?
            pipeline = ::Sales::Pipeline.create!(name: 'Avalia Solar B2B Sales', key: 'b2b_sales', active: true)
          end

          ensure_default_stages!(pipeline) if pipeline.stages.empty?
          pipeline
        end

        def resolve_stage(pipeline)
          stage_key = params.dig(:opportunity, :stage_key).presence
          stage_id = params.dig(:opportunity, :sales_stage_id).presence || params.dig(:opportunity, :stage_id).presence

          stage = if stage_key.present?
                    pipeline.stages.find_by(key: stage_key) || pipeline.stages.find_by(name: stage_key)
                  elsif stage_id.present?
                    pipeline.stages.find_by(id: stage_id) || ::Sales::Stage.find_by(id: stage_id)
                  end

          stage ||= pipeline.stages.order(:position).first
          stage ||= ::Sales::Stage.order(:position).first

          raise ActiveRecord::RecordNotFound, "Nenhum estágio encontrado para o pipeline '#{pipeline.name}'" if stage.nil?

          stage
        end

        def ensure_default_stages!(pipeline)
          default_stages = [
            %w[prospect Prospect 10], %w[contacted Contacted 20], %w[qualified Qualified 35],
            %w[discovery Discovery 50], %w[proposal Proposal 70], %w[negotiation Negotiation 85],
            ['won', 'Closed Won', '100', 'won'], ['lost', 'Closed Lost', '0', 'lost']
          ]
          default_stages.each_with_index do |(key, name, probability, terminal), position|
            pipeline.stages.find_or_create_by!(key:) do |stage|
              stage.name = name
              stage.position = position
              stage.probability = probability.to_i
              stage.terminal_type = terminal
            end
          end
        end

        def opportunity_create_params
          params.require(:opportunity).permit(
            :sales_account_id, :primary_contact_id,
            :sales_pipeline_id, :sales_stage_id, :stage_key,
            :name, :value_cents, :currency, :probability, :probability_overridden,
            :priority, :source, :expected_close_date, :next_activity_at, :status
          )
        end

        def opportunity_update_params
          params.require(:opportunity).permit(
            :sales_account_id, :primary_contact_id, :sales_stage_id,
            :name, :value_cents, :currency, :probability, :probability_overridden,
            :priority, :source, :expected_close_date, :next_activity_at, :status
          )
        end

        def opportunity_json(opportunity)
          contact = opportunity.primary_contact
          unless contact && current_tenant_scope.valid_relation?(account: opportunity.account, contact: contact, opportunity: opportunity)
            contact = nil
          end
          {
            id: opportunity.id,
            name: opportunity.name,
            value_cents: opportunity.value_cents,
            probability: opportunity.probability,
            status: opportunity.status,
            stage_key: opportunity.stage&.key,
            stage_entered_at: opportunity.stage_entered_at || opportunity.created_at,
            source: opportunity.source,
            sales_account_id: opportunity.sales_account_id,
            sales_pipeline_id: opportunity.sales_pipeline_id,
            account: opportunity.account ? { id: opportunity.account.id, name: opportunity.account.name } : nil,
            stage: opportunity.stage ? { id: opportunity.stage.id, key: opportunity.stage.key, name: opportunity.stage.name } : nil,
            contact_id: contact&.id,
            contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil,
            contact_email: contact&.email,
            owner_id: opportunity.owner_id,
            next_activity_at: opportunity.next_activity_at,
            expected_close_date: opportunity.expected_close_date,
            priority: opportunity.priority,
            tags: opportunity.tags.active.map do |t|
              { id: t.id, name: t.name, slug: t.slug, color: t.color, entity_type: t.entity_type }
            end,
            created_at: opportunity.created_at,
            updated_at: opportunity.updated_at
          }
        end

        def format_currency_brl(cents)
          reais = cents.to_f / 100.0
          formatted = sprintf('%.2f', reais).tr('.', ',')
          parts = formatted.split(',')
          parts[0] = parts[0].reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse
          "R$ #{parts.join(',')}"
        end
      end
    end
  end
end
