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

    def self.call(params = {})
      new(params).call
    end

    def initialize(params)
      @params = params
    end

    def call
      scope = ::Sales::Opportunity.all
      scope = scope.joins(:account).where(
        'sales_opportunities.name ILIKE :q OR sales_accounts.name ILIKE :q',
        q: "%#{ActiveRecord::Base.sanitize_sql_like(@params[:q].to_s.strip)}%"
      ) if @params[:q].present?
      scope = scope.where(status: @params[:status]) if @params[:status].present?
      scope = scope.where(sales_account_id: @params[:account_id]) if @params[:account_id].present?
      scope = scope.where(sales_pipeline_id: @params[:pipeline_id]) if @params[:pipeline_id].present?
      scope = scope.where(sales_stage_id: ids(:stage_id)) if @params[:stage_id].present?
      scope = scope.joins(:stage).where(sales_stages: { key: @params[:stage_key] }) if @params[:stage_key].present?
      scope = scope.joins(:tags).where(sales_tags: { id: ids(:tag_ids) }).distinct if @params[:tag_ids].present?
      scope = scope.where(owner_id: @params[:owner_id]) if numeric?(@params[:owner_id])
      scope = scope.where(owner_id: nil) if @params[:owner_id].to_s == 'unassigned'
      scope = scope.where('value_cents >= ?', @params[:value_min].to_i) if @params[:value_min].present?
      scope = scope.where('value_cents <= ?', @params[:value_max].to_i) if @params[:value_max].present?
      scope = apply_close_dates(scope)
      scope = scope.where(status: 'open') if @params[:status].blank?
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
