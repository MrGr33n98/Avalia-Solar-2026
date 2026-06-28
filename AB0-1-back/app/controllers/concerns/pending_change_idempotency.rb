# frozen_string_literal: true

# Ensures that duplicate requests (double-clicks) for creating pending changes
# are handled idempotently without creating duplicates in the database
module PendingChangeIdempotency
  extend ActiveSupport::Concern

  included do
    before_action :validate_and_set_idempotency_key, only: %i[
      update_info add_categories remove_category
      update_ctas update_logo update_banner
      upload_media add_video remove_video
    ]
  end

  private

  def validate_and_set_idempotency_key
    # Extract or generate idempotency key from request headers or params
    @idempotency_key = extract_or_generate_idempotency_key
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

  def create_idempotent_pending_change(change_type:, data:)
    # Try to find an existing pending change with the same idempotency key
    existing = @company.pending_changes.find_by(
      idempotency_key: @idempotency_key,
      status: 'pending'
    )

    # If exists and is pending, mark it as previously persisted and return
    if existing&.pending?
      # Rails helper to identify if record was already persisted before this request
      existing.define_singleton_method(:previously_persisted?) { true }
      return existing
    end

    # Otherwise, try to create new pending change
    begin
      pending_change = @company.pending_changes.create!(
        change_type: change_type,
        data: data,
        user_id: current_user&.id,
        status: 'pending',
        idempotency_key: @idempotency_key
      )
      # Mark as newly created (not previously persisted)
      pending_change.define_singleton_method(:previously_persisted?) { false }
      pending_change
    rescue ActiveRecord::RecordNotUnique
      # Another request already created this; find and return it
      retry_pending = @company.pending_changes.find_by(
        idempotency_key: @idempotency_key,
        status: 'pending'
      )
      retry_pending&.define_singleton_method(:previously_persisted?) { true }
      retry_pending
    end
  end
end
