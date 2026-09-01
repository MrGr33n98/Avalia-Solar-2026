module Sales
  module Opportunities
    class ChangeStage
      def self.call(opportunity:, stage:, actor:)
        new(opportunity:, stage:, actor:).call
      end

      def initialize(opportunity:, stage:, actor:)
        @opportunity, @stage, @actor = opportunity, stage, actor
      end

      def call
        Sales::Opportunity.transaction do
          @opportunity.lock!
          raise ArgumentError, 'Stage não pertence ao pipeline' unless @stage.sales_pipeline_id == @opportunity.sales_pipeline_id

          previous = @opportunity.stage
          return @opportunity if previous.id == @stage.id

          history = @opportunity.stage_histories.order(entered_at: :desc).first
          history&.update!(left_at: Time.current, duration_seconds: (Time.current - history.entered_at).to_i)
          @opportunity.update!(stage: @stage, stage_entered_at: Time.current,
                               probability: @opportunity.probability_overridden? ? @opportunity.probability : @stage.probability)
          @opportunity.stage_histories.create!(from_stage: previous, to_stage: @stage, actor: @actor, entered_at: Time.current)
          DomainEvent.create!(event_type: 'sales.opportunity.stage_changed', aggregate_type: @opportunity.class.name,
                              aggregate_id: @opportunity.id, occurred_at: Time.current,
                              payload: { opportunity_id: @opportunity.id, actor_id: @actor.id,
                                         from_stage_id: previous.id, to_stage_id: @stage.id })
          @opportunity
        end
      end
    end
  end
end
