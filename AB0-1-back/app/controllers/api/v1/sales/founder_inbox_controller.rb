# frozen_string_literal: true

module Api
  module V1
    module Sales
      class FounderInboxController < BaseController
        before_action :require_read_access!
        before_action :set_item, only: %i[update acknowledge resolve]

        def index
          render json: Revenue::FounderInboxService.list(user: current_user, arguments: filter_arguments)
        end

        def refresh
          require_manage_access!
          render json: Revenue::FounderInboxService.refresh(user: current_user), status: :ok
        end

        def update
          require_manage_access!
          @item.update!(status: status_param)
          render json: serialize(@item)
        end

        def acknowledge
          require_manage_access!
          @item.update!(status: 'acknowledged')
          render json: serialize(@item)
        end

        def resolve
          require_manage_access!
          @item.resolve!
          render json: serialize(@item)
        end

        private

        def require_read_access!
          require_sales_permission!('opportunities', 'read')
        end

        def require_manage_access!
          require_sales_permission!('opportunities', 'manage')
        end

        def set_item
          @item = ::Sales::FounderInboxItem.where(company_id: current_user.company_id).find(params[:id])
        end

        def filter_arguments
          filter = params.permit(:status, :needs_approval, :limit).to_h
          filter['needs_approval'] = ActiveModel::Type::Boolean.new.cast(filter['needs_approval']) if filter.key?('needs_approval')
          filter
        end

        def status_param
          status = params.require(:status).to_s
          return status if ::Sales::FounderInboxItem::STATUSES.include?(status)

          raise ActionController::BadRequest, 'Status de Founder Inbox inválido.'
        end

        def serialize(item)
          {
            id: item.id,
            kind: item.kind,
            status: item.status,
            title: item.title,
            why: item.why,
            evidence: item.evidence,
            recommended_action: item.recommended_action,
            risk_tier: item.risk_tier,
            approval_required: item.approval_required,
            account_id: item.sales_account_id,
            opportunity_id: item.sales_opportunity_id,
            observed_at: item.observed_at.iso8601,
            resolved_at: item.resolved_at&.iso8601
          }
        end
      end
    end
  end
end
