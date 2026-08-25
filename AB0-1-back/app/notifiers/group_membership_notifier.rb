# frozen_string_literal: true

class GroupMembershipNotifier < ApplicationNotifier

  notification_methods do
    def message
      case params[:event]
      when 'approved'
        "Sua solicitação para entrar no grupo '#{params[:group_name]}' foi aprovada!"
      when 'requested'
        "Novo pedido de adesão pendente no grupo '#{params[:group_name]}'."
      else
        "Atualização na comunidade '#{params[:group_name]}'."
      end
    end

    def url
      group_path(params[:group_slug])
    end
  end
end
