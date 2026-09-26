# frozen_string_literal: true

class SalesTimelineChannel < ApplicationCable::Channel
  def subscribed
    return reject unless ::Sales::AuthorizationService.sales_access?(user: current_user)

    opportunity = ::Sales::TenantScope.for(current_user).opportunities.find_by(id: params[:opportunity_id])
    return reject unless opportunity

    stream_from self.class.stream_name(company_id: opportunity.account.company_id, opportunity_id: opportunity.id)
  end

  def self.stream_name(company_id:, opportunity_id:)
    "sales:#{company_id}:timeline:opportunity:#{opportunity_id}"
  end
end
