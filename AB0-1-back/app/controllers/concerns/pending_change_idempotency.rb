# frozen_string_literal: true

# Ensures that duplicate requests (double-clicks) for creating pending changes
# are handled idempotently without creating duplicates in the database
module PendingChangeIdempotency
  extend ActiveSupport::Concern

  included do
    before_action :validate_and_set_idempotency_key, only: [
      :update_info, :add_categories, :remove_category,
      :update_ctas, :update_logo, :update_banner,
      :upload_media, :add_video, :remove_video
    ]
  end

  private

  def validate_and_set_idempotency_key
    # Extract or generate idempotency key from request headers or params
    @idempotency_key = extract_or_generate_idempotency_key
    
    # Check if an identical pending change already exists
    existing = find_existing_pending_change
    
    if existing.present?
      # Return cached/existing response to ensure idempotency
      return render json: {
        message: 'Request already processed',
        pending_change: existing.as_json,
        cached: true
      }, status: :ok
    end
  end

  def extract_or_generate_idempotency_key
    # Check header first (recommended by Idempotency-Key standard)
    # Reference: https://tools.ietf.org/html/draft-idempotency-key-header
    return request.headers['Idempotency-Key'] if request.headers['Idempotency-Key'].present?
    
    # Fallback: generate deterministic key based on request signature
    generate_deterministic_idempotency_key
  end

  def generate_deterministic_idempotency_key
    require 'digest'
    
    # Components of the key:
    # - user_id: ensures user's own requests only
    # - action: prevents mixing different operations
    # - method: differentiates GET from POST, etc
    # - sanitized params: the actual data (excluding idempotency_key itself)
    
    params_copy = params.to_unsafe_h.except(:idempotency_key, :controller, :action)
    
    data_to_hash = [
      current_user&.id.to_s,
      action_name,
      request.method,
      JSON.generate(params_copy)
    ].join('||')
    
    Digest::SHA256.hexdigest(data_to_hash)
  end

  def find_existing_pending_change
    return nil unless @company

    @company.pending_changes.where(
      idempotency_key: @idempotency_key,
      status: 'pending'
    ).first
  end
end
