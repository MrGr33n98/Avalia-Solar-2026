module Api
  module V1
    module Reviewer
      class CreatorLeadsController < BaseController
        def index
          leads = CreatorLead.where(creator_user: current_user).recent
          render json: leads.map { |lead| lead.attributes.except('email', 'phone', 'ip_address', 'user_agent') }
        end

        def update
          lead = CreatorLead.find_by!(id: params[:id], creator_user: current_user)
          lead.update!(status: params.require(:lead).permit(:status)[:status])
          render json: { id: lead.id, status: lead.status }
        end
      end
    end
  end
end
