# frozen_string_literal: true

module Sales
  module Leads
    class Create
      Result = Struct.new(:success?, :lead, :code, :message, :fields, keyword_init: true)

      def self.call(...)
        new(...).call
      end

      def initialize(actor:, attributes:, inline_account: nil, inline_contact: nil)
        @actor = actor || User.first
        @attributes = attributes.to_h.symbolize_keys
        @inline_account = inline_account&.to_h&.symbolize_keys
        @inline_contact = inline_contact&.to_h&.symbolize_keys
      end

      def call
        ActiveRecord::Base.transaction do
          account_id = resolve_account
          if account_id.blank?
            return Result.new(
              success?: false,
              code: 'ACCOUNT_REQUIRED',
              message: 'Uma Empresa (Account) válida é obrigatória para criar o lead.'
            )
          end

          pipeline = resolve_pipeline
          stage = resolve_stage(pipeline)

          clean_attrs = @attributes.except(:sales_account_id, :primary_contact_id, :account, :contact, :stage_key, :sales_stage_id, :competitor_ids, :contact_ids)

          opportunity = ::Sales::Opportunity.new(
            clean_attrs.merge(
              sales_account_id: account_id,
              owner: @actor,
              sales_pipeline: pipeline,
              sales_stage: stage,
              stage_entered_at: Time.current,
              status: clean_attrs[:status].presence || 'open',
              temperature: clean_attrs[:temperature].presence || 'cold'
            )
          )

          opportunity.probability = stage.probability unless opportunity.probability_overridden?
          opportunity.save!

          # Link Competitors if provided
          if @attributes[:competitor_ids].is_a?(Array)
            @attributes[:competitor_ids].each do |comp_id|
              opportunity.opportunity_competitors.find_or_create_by!(sales_competitor_id: comp_id)
            end
          end

          # Link Contacts if provided
          if @attributes[:contact_ids].is_a?(Array)
            @attributes[:contact_ids].each do |cnt_id|
              opportunity.opportunity_contacts.find_or_create_by!(sales_contact_id: cnt_id)
            end
          end

          # Create exactly one initial StageHistory record
          opportunity.stage_histories.create!(
            to_stage: stage,
            actor: @actor,
            entered_at: Time.current
          )

          Result.new(success?: true, lead: opportunity)
        end
      rescue ActiveRecord::RecordInvalid => e
        Result.new(
          success?: false,
          code: 'VALIDATION_ERROR',
          message: e.message,
          fields: e.record.errors.messages
        )
      rescue StandardError => e
        Result.new(
          success?: false,
          code: 'INTERNAL_ERROR',
          message: e.message
        )
      end

      private

      def resolve_account
        return @attributes[:sales_account_id] if @attributes[:sales_account_id].present?

        if @inline_account.present? && @inline_account[:name].present?
          new_account = ::Sales::Account.create!(
            name: @inline_account[:name],
            domain: @inline_account[:domain],
            user: @actor
          )
          return new_account.id
        end

        nil
      end

      def resolve_pipeline
        pipeline = if @attributes[:sales_pipeline_id].present?
                     ::Sales::Pipeline.find_by(id: @attributes[:sales_pipeline_id])
                   end
        pipeline ||= ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first
        pipeline ||= ::Sales::Pipeline.create!(name: 'Pipeline Padrão', key: 'default', active: true)
        pipeline
      end

      def resolve_stage(pipeline)
        stage_key = @attributes[:stage_key].presence
        stage_id = @attributes[:sales_stage_id].presence

        stage = if stage_key.present?
                  pipeline.stages.find_by(key: stage_key) || pipeline.stages.find_by(name: stage_key)
                elsif stage_id.present?
                  pipeline.stages.find_by(id: stage_id) || ::Sales::Stage.find_by(id: stage_id)
                end

        stage ||= pipeline.stages.order(:position).first
        stage
      end
    end
  end
end
