# frozen_string_literal: true

module Sales
  class AccountsQuery
    ALLOWED_SORTS = %w[name created_at last_contact_at owner opportunities_count pipeline_value].freeze
    DEFAULT_SORT = 'created_at'
    DEFAULT_DIRECTION = 'desc'

    attr_reader :relation, :params

    def initialize(relation = ::Sales::Account.all, params = {})
      @relation = relation
      @params = params.transform_keys(&:to_sym)
    end

    def self.call(relation = ::Sales::Account.all, params = {})
      new(relation, params).call
    end

    def call
      scope = relation.extending(QueryExtensions)
      scope = apply_ids_filter(scope)
      scope = apply_search(scope)
      scope = apply_owner_filter(scope)
      scope = apply_segment_filter(scope)
      scope = apply_status_filter(scope)
      scope = apply_tag_filter(scope)
      scope = apply_city_state_filter(scope)
      scope = apply_has_email_phone_filter(scope)
      scope = apply_sorting(scope)
      scope
    end

    module QueryExtensions
      def paginate_result(page: 1, per_page: 50)
        page_num = [page.to_i, 1].max
        per_num = [[per_page.to_i, 1].max, 100].min
        total_count = unscope(:order, :limit, :offset).count

        items = offset((page_num - 1) * per_num).limit(per_num)

        {
          records: items,
          meta: {
            page: page_num,
            per_page: per_num,
            total: total_count,
            total_pages: (total_count.to_f / per_num).ceil
          }
        }
      end
    end

    private

    def apply_ids_filter(scope)
      ids = Array(params[:ids] || params[:selected_ids]).reject(&:blank?)
      return scope if ids.empty?

      scope.where(id: ids)
    end

    def apply_search(scope)
      return scope if params[:q].blank?

      term = "%#{params[:q].to_s.downcase.strip}%"
      scope.where('LOWER(sales_accounts.name) LIKE :term OR LOWER(sales_accounts.domain) LIKE :term', term: term)
    end

    def apply_owner_filter(scope)
      owner_ids = Array(params[:owner_id] || params[:owner_ids]).reject(&:blank?)
      return scope if owner_ids.empty?

      scope.where(owner_id: owner_ids)
    end

    def apply_segment_filter(scope)
      segments = Array(params[:segment] || params[:company_types] || params[:type]).reject(&:blank?)
      return scope if segments.empty?

      scope.where(segment: segments)
    end

    def apply_status_filter(scope)
      return scope if params[:status].blank?

      scope.where(status: params[:status])
    end

    def apply_tag_filter(scope)
      tag_ids = Array(params[:tag_ids] || params[:tag_id]).reject(&:blank?)
      return scope if tag_ids.empty?

      account_ids = ::Sales::Tagging.where(taggable_type: 'Sales::Account', tag_id: tag_ids).select(:taggable_id)
      scope.where(id: account_ids)
    end

    def apply_city_state_filter(scope)
      scope = scope.where(city: params[:city]) if params[:city].present?
      scope = scope.where(state: params[:state]) if params[:state].present?
      scope
    end

    def apply_has_email_phone_filter(scope)
      if params[:has_email].to_s == 'true'
        scope = scope.where.not(email: [nil, ''])
      end
      if params[:has_phone].to_s == 'true'
        scope = scope.where.not(phone: [nil, ''])
      end
      scope
    end

    def apply_sorting(scope)
      sort_column = ALLOWED_SORTS.include?(params[:sort].to_s) ? params[:sort].to_s : DEFAULT_SORT
      direction = params[:direction].to_s.downcase == 'asc' ? 'asc' : DEFAULT_DIRECTION

      case sort_column
      when 'name'
        scope.order(name: direction, id: :desc)
      when 'created_at'
        scope.order(created_at: direction, id: :desc)
      when 'owner'
        scope.joins(:owner).order("users.name #{direction}", id: :desc)
      else
        scope.order(created_at: direction, id: :desc)
      end
    end
  end
end
