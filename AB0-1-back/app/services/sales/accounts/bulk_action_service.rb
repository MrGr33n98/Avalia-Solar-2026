# frozen_string_literal: true

module Sales
  module Accounts
    class BulkActionService
      attr_reader :tenant_scope, :account_ids, :action_type, :payload, :current_user

      ALLOWED_ACTIONS = %w[update_owner add_tag change_status change_segment delete].freeze

      def initialize(tenant_scope:, account_ids:, action_type:, payload: {}, current_user:)
        @tenant_scope = tenant_scope
        @account_ids = Array(account_ids).map(&:to_i).reject(&:zero?)
        @action_type = action_type.to_s
        @payload = payload.transform_keys(&:to_sym)
        @current_user = current_user
      end

      def self.call(tenant_scope:, account_ids:, action_type:, payload: {}, current_user:)
        new(
          tenant_scope: tenant_scope,
          account_ids: account_ids,
          action_type: action_type,
          payload: payload,
          current_user: current_user
        ).call
      end

      def call
        raise ArgumentError, "Ação em massa inválida: #{action_type}" unless ALLOWED_ACTIONS.include?(action_type)

        target_accounts = tenant_scope.where(id: account_ids)
        return { updated_count: 0, message: 'Nenhuma empresa selecionada no escopo.' } if target_accounts.empty?

        count = 0
        ActiveRecord::Base.transaction do
          case action_type
          when 'update_owner'
            owner_id = payload[:owner_id].presence
            raise ArgumentError, 'Novo responsável não informado' if owner_id.blank?

            count = target_accounts.update_all(owner_id: owner_id, updated_at: Time.current)
          when 'change_status'
            status = payload[:status].presence
            raise ArgumentError, 'Novo status não informado' if status.blank?

            count = target_accounts.update_all(status: status, updated_at: Time.current)
          when 'change_segment'
            segment = payload[:segment].presence
            raise ArgumentError, 'Novo segmento não informado' if segment.blank?

            count = target_accounts.update_all(segment: segment, updated_at: Time.current)
          when 'add_tag'
            tag_name = payload[:tag_name].presence || payload[:name]
            raise ArgumentError, 'Nome da tag não informado' if tag_name.blank?

            tag = ::Sales::Tag.find_or_create_by!(name: tag_name.strip)
            target_accounts.find_each do |acc|
              ::Sales::Tagging.find_or_create_by!(
                tag: tag,
                taggable: acc
              )
              count += 1
            end
          when 'delete'
            count = target_accounts.destroy_all.size
          end
        end

        { updated_count: count, message: "#{count} empresas atualizadas com sucesso." }
      end
    end
  end
end
