# frozen_string_literal: true

module Sales
  module Leads
    class Create
      Result = Struct.new(:success?, :lead, :code, :message, :fields, keyword_init: true)

      def self.call(...)
        new(...).call
      end

      def initialize(actor:, attributes:, inline_account: nil, inline_contact: nil)
        @actor = actor
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

          tenant_scope = ::Sales::TenantScope.for(@actor)
          account = tenant_scope.accounts.find_by(id: account_id)
          raise RelationalReferenceError unless account
          raise RelationalReferenceError unless tenant_scope.valid_owner?(@actor, account: account)

          primary_contact_id = @attributes[:primary_contact_id]
          if primary_contact_id.blank? && @inline_contact.present? && @inline_contact[:first_name].present?
            primary_contact_id = ::Sales::Contact.create!(
              sales_account_id: account.id,
              first_name: @inline_contact[:first_name],
              email: @inline_contact[:email],
              user: @actor
            ).id
          end
          contact_ids = ([primary_contact_id] + Array(@attributes[:contact_ids])).compact_blank.map(&:to_s).uniq
          contacts = contact_ids.index_with do |contact_id|
            contact = tenant_scope.contacts.find_by(id: contact_id)
            raise RelationalReferenceError unless contact && tenant_scope.valid_relation?(account: account, contact: contact)

            contact
          end

          pipeline = resolve_pipeline
          stage = resolve_stage(pipeline)

          clean_attrs = @attributes.except(
            :sales_account_id, :primary_contact_id, :account, :contact,
            :stage_key, :sales_stage_id, :sales_pipeline_id, :competitor_ids, :contact_ids
          )

          opportunity = ::Sales::Opportunity.new(
            clean_attrs.merge(
              sales_account_id: account_id,
              primary_contact_id: primary_contact_id,
              owner: @actor,
              pipeline: pipeline,
              stage: stage,
              sales_pipeline_id: pipeline.id,
              sales_stage_id: stage.id,
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
              opportunity.opportunity_contacts.find_or_create_by!(sales_contact_id: contacts.fetch(cnt_id.to_s).id)
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
      rescue PipelineNotConfiguredError => e
        Result.new(success?: false, code: 'CRM_PIPELINE_NOT_CONFIGURED', message: e.message)
      rescue StagePipelineMismatchError => e
        Result.new(success?: false, code: 'STAGE_PIPELINE_MISMATCH', message: e.message)
      rescue RelationalReferenceError
        Result.new(success?: false, code: 'INVALID_RELATION', message: 'Uma ou mais referências comerciais são inválidas ou incompatíveis.')
      rescue StandardError => e
        Result.new(
          success?: false,
          code: 'INTERNAL_ERROR',
          message: 'Não foi possível concluir a operação do lead.'
        )
      end

      private

      class PipelineNotConfiguredError < StandardError; end
      class StagePipelineMismatchError < StandardError; end
      class RelationalReferenceError < StandardError; end

      def resolve_account
        return @attributes[:sales_account_id] if @attributes[:sales_account_id].present?

        if @inline_account.present? && @inline_account[:name].present?
          new_account = ::Sales::Accounts::Create.call(
            actor: @actor,
            attributes: { name: @inline_account[:name], domain: @inline_account[:domain] }
          )
          return new_account.id
        end

        nil
      end

      def resolve_pipeline
        if @attributes[:sales_pipeline_id].present?
          pipeline = ::Sales::Pipeline.find_by(id: @attributes[:sales_pipeline_id])
          if pipeline.nil?
            raise PipelineNotConfiguredError, "Pipeline ##{@attributes[:sales_pipeline_id]} não encontrado."
          end

          return pipeline
        end

        pipeline = nil
        pipeline ||= ::Sales::Pipeline.find_by(active: true) || ::Sales::Pipeline.first
        pipeline ||= ::Sales::Pipeline.create!(name: 'Pipeline Padrão', key: 'default', active: true)
        pipeline
      end

      def resolve_stage(pipeline)
        stage_key = @attributes[:stage_key].presence
        stage_id = @attributes[:sales_stage_id].presence

        stage = if stage_key.present?
                  clean_key = stage_key.to_s.strip
                  lower_key = clean_key.downcase
                  pt_map = {
                    'prospect' => 'prospect', 'contatado' => 'contacted', 'contato' => 'contacted',
                    'qualificado' => 'qualified', 'qualificacao' => 'qualified', 'qualificação' => 'qualified',
                    'descoberta' => 'discovery', 'proposta' => 'proposal', 'negociacao' => 'negotiation',
                    'negociação' => 'negotiation', 'ganho' => 'won', 'fechado' => 'won', 'perdido' => 'lost'
                  }
                  target_key = pt_map[lower_key] || lower_key

                  pipeline.stages.find_by('LOWER(key) = ? OR LOWER(name) = ?', target_key, lower_key) ||
                    pipeline.stages.where('name ILIKE ? OR key ILIKE ?', "%#{clean_key}%", "%#{clean_key}%").first
                elsif stage_id.present?
                  pipeline.stages.find_by(id: stage_id)
                end

        if stage.nil? && (stage_key.present? || stage_id.present?)
          identifier = stage_key.presence || "##{stage_id}"
          raise StagePipelineMismatchError, "O estágio #{identifier} não pertence ao pipeline ##{pipeline.id}."
        end

        stage ||= pipeline.stages.order(:position).first
        raise PipelineNotConfiguredError, "Nenhum estágio configurado para o pipeline ##{pipeline.id}." if stage.nil?

        stage
      end
    end
  end
end
