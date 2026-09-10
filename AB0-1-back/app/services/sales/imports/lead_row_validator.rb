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
        return nil if identifier.blank?

        pipelines = if ::Sales::Pipeline.column_names.include?('company_id') && @company.present?
                      ::Sales::Pipeline.where(company_id: @company.id)
                    else
                      ::Sales::Pipeline.where(active: true)
                    end

        pipeline_ids = pipelines.pluck(:id)
        pipeline_ids = ::Sales::Pipeline.pluck(:id) if pipeline_ids.empty?
        return nil if pipeline_ids.empty?

        clean_id = identifier.to_s.strip
        lower_id = clean_id.downcase

        # 1. Busca exata por key ou name ou id
        stage = ::Sales::Stage.where(sales_pipeline_id: pipeline_ids)
                              .where('LOWER(key) = ? OR id::text = ? OR LOWER(name) = ?', lower_id, clean_id, lower_id)
                              .first
        return stage if stage.present?

        # 2. Mapeamento de termos em PT-BR para chaves padrão
        pt_mapping = {
          'prospect' => 'prospect',
          'contatado' => 'contacted',
          'contato' => 'contacted',
          'qualificado' => 'qualified',
          'qualificacao' => 'qualified',
          'qualificação' => 'qualified',
          'descoberta' => 'discovery',
          'proposta' => 'proposal',
          'negociacao' => 'negotiation',
          'negociação' => 'negotiation',
          'ganho' => 'won',
          'fechado' => 'won',
          'perdido' => 'lost'
        }
        mapped_key = pt_mapping[lower_id]
        if mapped_key.present?
          stage = ::Sales::Stage.where(sales_pipeline_id: pipeline_ids).find_by('LOWER(key) = ?', mapped_key)
          return stage if stage.present?
        end

        # 3. Busca parcial por aproximação
        ::Sales::Stage.where(sales_pipeline_id: pipeline_ids)
                      .where('name ILIKE ? OR key ILIKE ?', "%#{clean_id}%", "%#{clean_id}%")
                      .first
      end
    end
  end
end
