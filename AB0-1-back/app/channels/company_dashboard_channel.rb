# frozen_string_literal: true

class CompanyDashboardChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user

    company = resolve_company
    reject unless company

    stream_from "company:#{company.id}:dashboard"
  end

  private

  def resolve_company
    # Company users can only subscribe to their own company
    if current_user.respond_to?(:company_user?) && current_user.company_user?
      return current_user.company
    end

    # Admin/Review can subscribe to any company if company_id param is provided
    if (current_user.respond_to?(:admin?) && current_user.admin?) || (current_user.respond_to?(:review_user?) && current_user.review_user?)
      cid = params[:company_id].presence
      return Company.find_by(id: cid) if cid
    end

    nil
  end
end
