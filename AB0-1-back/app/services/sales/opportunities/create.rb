# frozen_string_literal: true

module Sales
  module Opportunities
    class Create
      Result = Struct.new(:success?, :opportunity, :code, :message, :fields, keyword_init: true)

      def self.call(...)
        new(...).call
      end

      def initialize(actor:, company: nil, attributes:, inline_account: nil, inline_contact: nil)
        @actor = actor
        @company = company
        @attributes = attributes.to_h.symbolize_keys
        @inline_account = inline_account&.to_h&.symbolize_keys
        @inline_contact = inline_contact&.to_h&.symbolize_keys
      end

      def call
        ActiveRecord::Base.transaction do
          account_id = resolve_account
          contact_id = resolve_contact(account_id)

          validate_contact_account_consistency!(contact_id, account_id) if contact_id.present? && account_id.present?

          pipeline = resolve_pipeline
          stage = resolve_stage(pipeline)

          clean_attrs = @attributes.except(:sales_account_id, :primary_contact_id, :account, :contact, :stage_key, :sales_stage_id)

          opportunity = ::Sales::Opportunity.new(
            clean_attrs.merge(
              sales_account_id: account_id,
              primary_contact_id: contact_id,
              owner: @actor,
              sales_pipeline: pipeline,
              sales_stage: stage,
              stage_entered_at: Time.current,
              status: clean_attrs[:status].presence || 'open'
            )
          )

          opportunity.probability = stage.probability unless opportunity.probability_overridden?
          opportunity.save!

          opportunity.stage_histories.create!(
            to_stage: stage,
            actor: @actor,
            entered_at: Time.current
          )

          Result.new(success?: true, opportunity: opportunity)
        end
      rescue CustomerAccountMismatchError => e
        Result.new(success?: false, code: 'CONTACT_ACCOUNT_MISMATCH', message: e.message)
      rescue PipelineNotConfiguredError => e
        Result.new(success?: false, code: 'CRM_PIPELINE_NOT_CONFIGURED', message: e.message)
      rescue ActiveRecord::RecordInvalid => e
        Result.new(
          success?: false,
          code: 'VALIDATION_ERROR',
          message: e.message,
          fields: e.record.errors.messages
        )
      end

      private

      class CustomerAccountMismatchError < StandardError; end
      class PipelineNotConfiguredError < StandardError; end

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

      def resolve_contact(account_id)
        return @attributes[:primary_contact_id] if @attributes[:primary_contact_id].present?

        if @inline_contact.present? && @inline_contact[:first_name].present? && account_id.present?
          new_contact = ::Sales::Contact.create!(
            sales_account_id: account_id,
            first_name: @inline_contact[:first_name],
            email: @inline_contact[:email],
            user: @actor
          )
          return new_contact.id
        end

        nil
      end

      def validate_contact_account_consistency!(contact_id, account_id)
        contact = ::Sales::Contact.find_by(id: contact_id)
        return if contact.nil?

        if contact.sales_account_id.present? && contact.sales_account_id != account_id.to_i
          raise CustomerAccountMismatchError, "O contato ##{contact_id} pertence à conta ##{contact.sales_account_id}, não à conta ##{account_id} selecionada."
        end
      end

      def resolve_pipeline
        pipeline = if @attributes[:sales_pipeline_id].present?
                     ::Sales::Pipeline.find_by(id: @attributes[:sales_pipeline_id])
                   end
        pipeline ||= ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first

        if pipeline.nil?
          raise PipelineNotConfiguredError, "Nenhum pipeline comercial ativo configurado no sistema."
        end

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

        if stage.nil?
          raise PipelineNotConfiguredError, "Nenhum estágio configurado para o pipeline '#{pipeline.name}'."
        end

        stage
      end
    end
  end
end
