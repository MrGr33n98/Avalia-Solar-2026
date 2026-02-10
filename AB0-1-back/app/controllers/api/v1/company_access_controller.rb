module Api
  module V1
    class CompanyAccessController < BaseController
      before_action :authenticate_api_user
      before_action :authorize_company_access_user!

      def context
        active_memberships = current_user.active_company_members.includes(:company)
        pending_requests = current_user.company_access_requests.pending.includes(:company)
        query = params[:q].to_s.strip
        limit = safe_limit(params[:limit])

        active_company_ids = active_memberships.map(&:company_id)
        pending_company_ids = pending_requests.map(&:company_id)
        company_columns = ::Company.column_names

        suggested_scope = ::Company.all
        if company_columns.include?('status')
          suggested_scope = suggested_scope.where(status: 'active')
        end
        if company_columns.include?('moderation_status')
          suggested_scope = suggested_scope.where(moderation_status: 'approved')
        end
        excluded_company_ids = (active_company_ids + pending_company_ids).uniq
        suggested_scope = suggested_scope.where.not(id: excluded_company_ids) if excluded_company_ids.any?
        suggested_scope = apply_company_query_filter(suggested_scope, query, company_columns)
        suggested_scope = apply_company_sort_order(suggested_scope, company_columns)

        suggested_companies = suggested_scope
                              .with_attached_logo
                              .limit(limit)
                              .select(*company_context_select_columns(company_columns))

        track_company_access_context_request('success')

        render json: {
          active_memberships: active_memberships.map do |member|
            {
              company_id: member.company_id,
              company_name: member.company&.name || "Empresa ##{member.company_id}",
              company_slug: member.company&.respond_to?(:slug) ? member.company.slug : nil,
              member_role: member.role,
              member_status: member.status
            }
          end,
          pending_requests: pending_requests.map do |request|
            {
              id: request.id,
              company_id: request.company_id,
              company_name: request.company&.name || "Empresa ##{request.company_id}",
              status: request.status,
              requested_at: request.requested_at&.iso8601
            }
          end,
          suggested_companies: suggested_companies.map do |company|
            {
              company_id: company.id,
              company_name: company.name.to_s,
              company_slug: company_has_column?(company, :slug) ? company.slug : nil,
              city: company_has_column?(company, :city) ? company.city : nil,
              state: company_has_column?(company, :state) ? company.state : nil,
              verified: company_has_column?(company, :verified) ? company.verified : false,
              logo_url: company.logo_url
            }
          end,
          query: query.presence,
          limit: limit
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyAccessController] context failed user_id=#{current_user&.id} " \
          "error=#{e.class} message=#{e.message}"
        )
        track_company_access_context_request('error')

        render_error_response(
          message: 'Nao foi possivel carregar o contexto de acesso no momento.',
          status: :internal_server_error,
          code: 'COMPANY_ACCESS_CONTEXT_FAILED',
          details: Rails.env.development? ? { error: e.message } : nil
        )
      end

      def select_active_company
        company_id = params[:company_id]
        unless current_user.active_membership_for?(company_id)
          return render_error_response(
            message: 'VocÃª nÃ£o possui acesso a esta empresa',
            status: :forbidden,
            code: 'FORBIDDEN_COMPANY'
          )
        end

        current_user.update(company_id: company_id)
        cookies.signed[:active_company_id] = {
          value: company_id,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :lax,
          expires: 30.days.from_now,
          path: '/'
        }

        render json: {
          message: 'Empresa ativa selecionada com sucesso',
          company_id: company_id
        }, status: :ok
      end

      private

      def authorize_company_access_user!
        return if current_user&.role.in?(%w[company review])

        render_error_response(
          message: 'Not authorized to perform this action',
          status: :forbidden,
          code: 'FORBIDDEN'
        )
      end

      def safe_limit(raw_limit)
        parsed = raw_limit.to_i
        return 8 if parsed <= 0

        [parsed, 30].min
      end

      def apply_company_query_filter(scope, query, company_columns)
        return scope if query.blank?

        normalized = ActiveRecord::Base.sanitize_sql_like(query.downcase)
        query_clauses = ['LOWER(companies.name) LIKE :term']
        if company_columns.include?('slug')
          query_clauses << "LOWER(COALESCE(companies.slug, '')) LIKE :term"
        end

        scope.where(query_clauses.join(' OR '), term: "%#{normalized}%")
      end

      def apply_company_sort_order(scope, company_columns)
        order_hash = {}
        order_hash[:featured] = :desc if company_columns.include?('featured')
        order_hash[:rating_avg] = :desc if company_columns.include?('rating_avg')
        order_hash[:name] = :asc if company_columns.include?('name')

        return scope if order_hash.empty?

        scope.order(order_hash)
      end

      def company_context_select_columns(company_columns)
        columns = %i[id name]
        columns << :slug if company_columns.include?('slug')
        columns << :city if company_columns.include?('city')
        columns << :state if company_columns.include?('state')
        columns << :verified if company_columns.include?('verified')
        columns
      end

      def company_has_column?(record, column_name)
        record.respond_to?(:has_attribute?) && record.has_attribute?(column_name.to_s)
      end

      def track_company_access_context_request(status)
        return unless defined?(Yabeda)
        return unless Yabeda.respond_to?(:ab0)
        return unless Yabeda.ab0.respond_to?(:company_access_context_requests_total)

        Yabeda.ab0.company_access_context_requests_total.increment({ status: status }, by: 1)
      rescue StandardError
        # Metrics must never break the request lifecycle.
      end
    end
  end
end
