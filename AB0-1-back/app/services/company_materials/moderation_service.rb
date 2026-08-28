# frozen_string_literal: true

module CompanyMaterials
  class ModerationService
    def initialize(material:, admin_user:)
      @material = material
      @admin_user = admin_user
    end

    def approve!
      raise StandardError, 'Este material ainda não possui um PDF pronto para publicação.' unless @material.publishable?

      CompanyMaterial.transaction do
        @material.publish!
        decision!('approved')
      end
    end

    def reject!(reason:)
      reason = reason.to_s.strip
      raise ArgumentError, 'Motivo obrigatório.' if reason.blank?

      CompanyMaterial.transaction do
        @material.unpublish!(target_status: 'rejected', reason: reason)
        decision!('rejected', reason)
      end
    end

    def request_changes!(reason:)
      reason = reason.to_s.strip
      raise ArgumentError, 'Motivo obrigatório.' if reason.blank?

      CompanyMaterial.transaction do
        @material.unpublish!(target_status: 'draft', reason: reason)
        decision!('changes_requested', reason)
      end
    end

    private

    def decision!(decision, reason = nil)
      ContentModerationDecision.create!(company: @material.company, moderatable: @material,
                                        admin_user: @admin_user, decision: decision, reason: reason)
    end
  end
end

