# frozen_string_literal: true

module Sales
  module PipelineBoard
    class BoardQuery
      def self.call(pipeline_id:, current_user:, params: {})
        new(pipeline_id: pipeline_id, current_user: current_user, params: params).call
      end

      def initialize(pipeline_id:, current_user:, params: {})
        @pipeline_id = pipeline_id
        @current_user = current_user
        @params = params
      end

      def call
        pipeline = resolve_pipeline
        return nil unless pipeline

        stages = pipeline.stages.order(:position, :id)

        tenant_scope = ::Sales::TenantScope.for(@current_user).opportunities
        scope = tenant_scope
                  .where(sales_pipeline_id: pipeline.id)
                  .preload(:account, :stage, :primary_contact, :owner, :source, :qualification, :tags)

        scope = apply_filters(scope)

        opportunities = fetch_opportunities_with_latest_activity_and_task(scope)

        {
          pipeline: pipeline,
          stages: stages,
          opportunities: opportunities
        }
      end

      private

      def resolve_pipeline
        if @pipeline_id.blank? || @pipeline_id == 'default'
          return ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first
        end

        ::Sales::Pipeline.find_by(id: @pipeline_id) || ::Sales::Pipeline.find_by(key: @pipeline_id)
      end

      def apply_filters(scope)
        if @params[:status].present?
          scope = scope.where(status: @params[:status])
        else
          scope = scope.where(status: 'open')
        end

        if @params[:search].present?
          term = "%#{@params[:search].downcase}%"
          scope = scope.left_joins(:account, :primary_contact).where(
            'LOWER(sales_opportunities.name) LIKE :term OR LOWER(sales_accounts.name) LIKE :term OR LOWER(sales_contacts.first_name) LIKE :term OR LOWER(sales_contacts.last_name) LIKE :term',
            term: term
          )
        end

        if @params[:owner_id].present?
          if @params[:owner_id].to_s == 'unassigned'
            scope = scope.where(owner_id: nil)
          elsif @params[:owner_id].to_s == 'me' && @current_user.present?
            scope = scope.where(owner_id: @current_user.id)
          else
            scope = scope.where(owner_id: @params[:owner_id])
          end
        end

        if @params[:closing_this_week].to_s == 'true' || @params[:closing_this_week] == true
          beginning = Date.current.beginning_of_week
          ending = Date.current.end_of_week
          scope = scope.where(expected_close_date: beginning..ending)
        end

        if @params[:temperature].present?
          scope = scope.where(temperature: @params[:temperature])
        end

        scope = scope.joins(:stage).where(sales_stages: { key: @params[:stage_key] }) if @params[:stage_key].present?
        if @params[:value_min].present?
          scope = scope.where('sales_opportunities.value_cents >= ?', @params[:value_min].to_i)
        end
        if @params[:value_max].present?
          scope = scope.where('sales_opportunities.value_cents <= ?', @params[:value_max].to_i)
        end

        # Aplica filtros avançados completos (operadores is e is_not, tags, sources, competitors, states, etc.)
        scope = ::Sales::OpportunitiesQuery.call(@params, scope)

        scope
      end

      def fetch_opportunities_with_latest_activity_and_task(scope)
        opportunities = scope.to_a
        return [] if opportunities.empty?

        opp_ids = opportunities.map(&:id)

        latest_activities = ::Sales::Activity
                              .where(sales_opportunity_id: opp_ids)
                              .order(occurred_at: :desc, created_at: :desc)
                              .group_by(&:sales_opportunity_id)
                              .transform_values(&:first)

        next_tasks = ::Sales::Task
                       .where(sales_opportunity_id: opp_ids, status: 'pending')
                       .order(Arel.sql('due_at ASC NULLS LAST, created_at ASC'))
                       .group_by(&:sales_opportunity_id)
                       .transform_values(&:first)

        opportunities.map do |opp|
          {
            record: opp,
            latest_activity: latest_activities[opp.id],
            next_task: next_tasks[opp.id]
          }
        end
      end
    end
  end
end
