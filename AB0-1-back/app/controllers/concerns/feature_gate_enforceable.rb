# frozen_string_literal: true

module FeatureGateEnforceable
  extend ActiveSupport::Concern

  private

  def enforce_feature_access!(feature_name, company: nil, company_id: nil)
    feature_key = feature_name.to_s
    target_company = company || feature_gate_company_for(company_id)
    return if performed? || target_company.blank?

    feature_state = target_company.feature_access[feature_key] || {}
    return if feature_state['state'] == 'enabled'

    reason = feature_state['reason'].presence || 'upgrade_required'
    log_feature_gate_block(target_company, feature_key, reason)

    render json: {
      code: "#{feature_key.upcase}_NOT_AVAILABLE",
      error: 'Feature not available in your plan',
      feature: feature_key,
      reason: reason,
      plan: target_company.respond_to?(:inferred_plan_tier) ? target_company.inferred_plan_tier : 'free',
      suggestion: 'Upgrade your plan to unlock this feature'
    }, status: :forbidden
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Company not found' }, status: :not_found
  end

  def feature_gate_company_for(company_id = nil)
    id = company_id.presence || params[:company_id].presence || params[:company_id_eq].presence || params[:id].presence
    return nil if id.blank?

    ::Company.find(id)
  end

  def log_feature_gate_block(company, feature_name, reason)
    Rails.logger.warn(
      "[FeatureGate] blocked user_id=#{current_user&.id} company_id=#{company.id} " \
      "feature=#{feature_name} reason=#{reason} path=#{request.path}"
    )

    return unless defined?(Analytics::TrackEventService)

    Analytics::TrackEventService.call(
      company_id: company.id,
      user: current_user,
      event_type: 'feature_gate_blocked',
      metadata: {
        feature: feature_name,
        reason: reason,
        path: request.path
      }
    )
  end
end
