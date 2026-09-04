# frozen_string_literal: true

module Sales
  module Pipeline
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

        scope = ::Sales::Opportunity
                  .where(sales_pipeline_id: pipeline.id)
                  .includes(:account, :stage, :primary_contact, :owner, :source, :qualification, :tags)

        scope = apply_tenant_scope(scope)
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
        if @pipeline_id.present? && @pipeline_id != 'default'
          p = ::Sales::Pipeline.find_by(id: @pipeline_id) || ::Sales::Pipeline.find_by(key: @pipeline_id)
          return p if p
        end

        ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first
      end

      def apply_tenant_scope(scope)
        return scope if @current_user.admin?

        scope.joins(:account).where(sales_accounts: { company_id: @current_user.company_id })
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
          scope = scope.where(owner_id: @params[:owner_id])
        end

        if @params[:temperature].present?
          scope = scope.where(temperature: @params[:temperature])
        end

        scope
      end

      def fetch_opportunities_with_latest_activity_and_task(scope)
        # Select opportunities and batch load latest_activity and next_task via efficient batching
        opportunities = scope.to_a
        return [] if opportunities.empty?

        opp_ids = opportunities.map(&:id)

        # Batch load latest activities (1 query for all cards)
        latest_activities = ::Sales::Activity
                              .where(sales_opportunity_id: opp_ids)
                              .order(occurred_at: :desc, created_at: :desc)
                              .group_by(&:sales_opportunity_id)
                              .transform_values(&:first)

        # Batch load next pending tasks (1 query for all cards)
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
