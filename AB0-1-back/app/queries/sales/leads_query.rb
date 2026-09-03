# frozen_string_literal: true

module Sales
  class LeadsQuery
    def self.call(params = {}, scope = ::Sales::Opportunity.all)
      new(params, scope).call
    end

    def initialize(params = {}, scope = ::Sales::Opportunity.all)
      @params = params
      @scope = scope
    end

    def call
      scope = @scope.includes(:account, :primary_contact, :stage, :source, :competitors)

      if @params[:q].present?
        q = "%#{@params[:q].to_s.downcase.strip}%"
        scope = scope.left_outer_joins(:account, :primary_contact)
                     .where('LOWER(sales_opportunities.name) LIKE :q OR LOWER(sales_accounts.name) LIKE :q OR LOWER(sales_contacts.first_name) LIKE :q', q: q)
      end

      if @params[:temperature].present?
        scope = scope.where(temperature: @params[:temperature])
      end

      if @params[:status].present?
        scope = scope.where(status: @params[:status])
      end

      if @params[:owner_id].present?
        if @params[:owner_id] == 'unassigned'
          scope = scope.where(owner_id: nil)
        else
          scope = scope.where(owner_id: @params[:owner_id])
        end
      end

      if @params[:pipeline_id].present?
        scope = scope.where(sales_pipeline_id: @params[:pipeline_id])
      end

      if @params[:stage_id].present?
        scope = scope.where(sales_stage_id: @params[:stage_id])
      end

      if @params[:account_id].present?
        scope = scope.where(sales_account_id: @params[:account_id])
      end

      if @params[:source_id].present?
        scope = scope.where(source_id: @params[:source_id])
      end

      sort_field = %w[created_at value_cents name expected_close_date].include?(@params[:sort].to_s) ? @params[:sort] : 'created_at'
      sort_dir = @params[:direction].to_s.downcase == 'asc' ? 'asc' : 'desc'

      scope.order("sales_opportunities.#{sort_field} #{sort_dir}")
    end
  end
end
