# frozen_string_literal: true

module EffectiveTenancyResolvable
  extend ActiveSupport::Concern

  included do
    helper_method :current_effective_company if respond_to?(:helper_method)
  end

  def current_effective_company
    @current_effective_company ||= resolve_effective_company
  end

  private

  def resolve_effective_company
    return nil unless current_user

    candidate_id = params[:company_id].presence ||
                   request.headers['X-Company-Id'].presence ||
                   cookies.signed[:active_company_id].presence ||
                   (current_user.respond_to?(:company_id) ? current_user.company_id : nil)

    if candidate_id.present?
      if current_user.respond_to?(:admin?) && current_user.admin?
        found = ::Company.find_by(id: candidate_id)
        return found if found
      end

      if current_user.respond_to?(:active_membership_for?) && current_user.active_membership_for?(candidate_id)
        found = ::Company.find_by(id: candidate_id)
        return found if found
      end
    end

    if current_user.respond_to?(:active_member_companies)
      active_first = current_user.active_member_companies.first
      return active_first if active_first.present?
    end

    current_user.company if current_user.respond_to?(:company)
  end
end
