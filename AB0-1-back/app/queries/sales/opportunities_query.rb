# frozen_string_literal: true

module Sales
  class OpportunitiesQuery
    SORT_FIELDS = {
      'created_at' => 'sales_opportunities.created_at',
      'updated_at' => 'sales_opportunities.updated_at',
      'value_cents' => 'sales_opportunities.value_cents',
      'expected_close_date' => 'sales_opportunities.expected_close_date',
      'last_activity_at' => 'sales_opportunities.last_activity_at'
    }.freeze

    def self.call(params = {}, initial_scope = nil)
      new(params, initial_scope).call
    end

    def initialize(params = {}, initial_scope = nil)
      @params = params || {}
      @initial_scope = initial_scope
    end

    def call
      scope = @initial_scope || ::Sales::Opportunity.all
      scope = scope.joins(:account).where(
        'sales_opportunities.name ILIKE :q OR sales_accounts.name ILIKE :q',
        q: "%#{ActiveRecord::Base.sanitize_sql_like(@params[:q].to_s.strip)}%"
      ) if @params[:q].present?

      # Status / Outcome
      if @params[:status].present?
        scope = scope.where(status: @params[:status])
      elsif @params[:status_in].present?
        scope = scope.where(status: Array(@params[:status_in]))
      else
        scope = scope.where(status: 'open') if @params[:all_statuses].blank?
      end
      scope = scope.where.not(status: Array(@params[:status_not])) if @params[:status_not].present?

      # Account / Company
      scope = scope.where(sales_account_id: @params[:account_id]) if @params[:account_id].present?
      scope = scope.where(sales_account_id: ids(:account_ids)) if @params[:account_ids].present?
      scope = scope.where.not(sales_account_id: ids(:account_ids_not)) if @params[:account_ids_not].present?

      # Pipeline & Stage
      scope = scope.where(sales_pipeline_id: @params[:pipeline_id]) if @params[:pipeline_id].present?
      scope = scope.where(sales_stage_id: ids(:stage_id)) if @params[:stage_id].present?
      scope = scope.where.not(sales_stage_id: ids(:stage_id_not)) if @params[:stage_id_not].present?
      scope = scope.joins(:stage).where(sales_stages: { key: @params[:stage_key] }) if @params[:stage_key].present?

      # Assignee / Owner
      if @params[:owner_id].present?
        scope = scope.where(owner_id: @params[:owner_id]) if numeric?(@params[:owner_id])
        scope = scope.where(owner_id: nil) if @params[:owner_id].to_s == 'unassigned'
      end
      scope = scope.where(owner_id: ids(:owner_ids)) if @params[:owner_ids].present?
      scope = scope.where.not(owner_id: ids(:owner_ids_not)) if @params[:owner_ids_not].present?

      # Sources
      scope = scope.where(source_id: ids(:source_ids)) if @params[:source_ids].present?
      scope = scope.where.not(source_id: ids(:source_ids_not)) if @params[:source_ids_not].present?

      # Tags
      scope = scope.joins(:tags).where(sales_tags: { id: ids(:tag_ids) }).distinct if @params[:tag_ids].present?
      if @params[:tag_ids_not].present?
        excluded_ids = ::Sales::Opportunity.joins(:tags).where(sales_tags: { id: ids(:tag_ids_not) }).select(:id)
        scope = scope.where.not(id: excluded_ids)
      end

      # Competitors
      if @params[:competitor_ids].present?
        scope = scope.joins(:competitors).where(sales_competitors: { id: ids(:competitor_ids) }).distinct
      end
      if @params[:competitor_ids_not].present?
        excluded_ids = ::Sales::Opportunity.joins(:competitors).where(sales_competitors: { id: ids(:competitor_ids_not) }).select(:id)
        scope = scope.where.not(id: excluded_ids)
      end

      # Value
      scope = scope.where('sales_opportunities.value_cents >= ?', @params[:value_min].to_i) if @params[:value_min].present?
      scope = scope.where('sales_opportunities.value_cents <= ?', @params[:value_max].to_i) if @params[:value_max].present?

      # Close Dates
      scope = apply_close_dates(scope)

      # Age (dias de vida)
      scope = scope.where('sales_opportunities.created_at <= ?', @params[:age_min_days].to_i.days.ago) if @params[:age_min_days].present?
      scope = scope.where('sales_opportunities.created_at >= ?', @params[:age_max_days].to_i.days.ago) if @params[:age_max_days].present?

      # Last Contacted
      if @params[:last_contacted_days].present?
        scope = scope.where('sales_opportunities.last_activity_at >= ?', @params[:last_contacted_days].to_i.days.ago)
      end

      # State (UF)
      if @params[:states].present?
        ufs = Array(@params[:states]).map(&:to_s).reject(&:blank?)
        scope = scope.joins(:account).where(sales_accounts: { state: ufs })
      end

      scope.order("#{SORT_FIELDS.fetch(@params[:sort].to_s, SORT_FIELDS['created_at'])} #{direction}")
    end

    private

    def ids(key)
      Array(@params[key]).flat_map { |value| value.to_s.split(',') }.select { |value| value.match?(/\A\d+\z/) }
    end

    def numeric?(value)
      value.to_s.match?(/\A\d+\z/)
    end

    def apply_close_dates(scope)
      scope = scope.where('expected_close_date >= ?', Date.parse(@params[:close_from].to_s)) if @params[:close_from].present?
      scope = scope.where('expected_close_date <= ?', Date.parse(@params[:close_to].to_s)) if @params[:close_to].present?
      scope
    rescue Date::Error
      scope
    end

    def direction
      @params[:direction].to_s.downcase == 'asc' ? 'ASC' : 'DESC'
    end
  end
end
