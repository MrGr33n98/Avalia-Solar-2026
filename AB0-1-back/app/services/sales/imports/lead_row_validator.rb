# frozen_string_literal: true

module Sales
  module Imports
    class LeadRowValidator
      EMAIL_REGEX = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/

      def self.call(dto, company:)
        new(dto, company: company).validate
      end

      def initialize(dto, company:)
        @dto = dto
        @company = company
      end

      def validate
        errors = []
        warnings = []

        # 1. Require company_name OR contact_name
        if @dto.company_name.blank? && @dto.contact_name.blank?
          errors << 'Empresa ou Nome do Contato é obrigatório'
        end

        # 2. Require at least one contact channel
        has_channel = @dto.email.present? || @dto.phone.present? || @dto.whatsapp.present? || @dto.website.present?
        unless has_channel
          warnings << 'Nenhum canal de contato fornecido (email, telefone, whatsapp ou site)'
        end

        # 3. Format validation for email if present
        if @dto.email.present? && !@dto.email.match?(EMAIL_REGEX)
          errors << "Formato de e-mail inválido: '#{@dto.email}'"
        end

        # 4. Tenant-scoped owner check
        if @dto.owner_identifier.present?
          owner_found = resolve_owner(@dto.owner_identifier)
          if owner_found.nil?
            warnings << "Vendedor '#{@dto.owner_identifier}' não foi encontrado no tenant"
          end
        end

        # 5. Tenant-scoped stage check
        if @dto.stage_identifier.present?
          stage_found = resolve_stage(@dto.stage_identifier)
          if stage_found.nil?
            warnings << "Estágio '#{@dto.stage_identifier}' não foi encontrado na organização"
          end
        end

        valid = errors.empty?

        {
          valid: valid,
          errors: errors,
          warnings: warnings
        }
      end

      private

      def resolve_owner(identifier)
        return nil if @company.nil?

        @company.users.find_by('email = ? OR id::text = ? OR name ILIKE ?', identifier.downcase, identifier, identifier)
      end

      def resolve_stage(identifier)
        return nil if @company.nil?

        pipeline_ids = ::Sales::Pipeline.where(company_id: @company.id).pluck(:id)
        return nil if pipeline_ids.empty?

        ::Sales::Stage.where(sales_pipeline_id: pipeline_ids)
                      .find_by('key = ? OR id::text = ? OR name ILIKE ?', identifier.downcase, identifier, identifier)
      end
    end
  end
end
