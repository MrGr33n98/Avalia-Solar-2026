# frozen_string_literal: true

module CompanyMaterials
  class ModerationService
    def initialize(material:, admin_user:)
      @material = material
      @admin_user = admin_user
    end

    def approve!
      pdf_assets = @material.digital_assets.document.where.not(status: 'archived')
      raise StandardError, 'Este material ainda não possui um PDF pronto para publicação.' unless pdf_assets.where(processing_status: 'ready').exists?

      CompanyMaterial.transaction do
        @material.update!(status: 'published', published_at: Time.current, moderation_reason: nil)
        pdf_assets.where(processing_status: 'ready').find_each { |asset| asset.update!(status: 'published') }
        decision!('approved')
      end
    end

    def reject!(reason:)
      transition!('rejected', reason, 'rejected')
    end

    def request_changes!(reason:)
      transition!('draft', reason, 'changes_requested')
    end

    private

    def transition!(status, reason, decision)
      reason = reason.to_s.strip
      raise ArgumentError, 'Motivo obrigatório.' if reason.blank?

      CompanyMaterial.transaction do
        @material.update!(status: status, published_at: nil, moderation_reason: reason)
        decision!(decision, reason)
      end
    end

    def decision!(decision, reason = nil)
      ContentModerationDecision.create!(company: @material.company, moderatable: @material,
                                        admin_user: @admin_user, decision: decision, reason: reason)
    end
  end
end
