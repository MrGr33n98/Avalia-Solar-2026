# frozen_string_literal: true

module Recommendation
  class ReasonResolver
    def self.call(company:, context:, is_sponsored: false)
      new(company: company, context: context, is_sponsored: is_sponsored).call
    end

    def initialize(company:, context:, is_sponsored: false)
      @company = company
      @context = context
      @is_sponsored = is_sponsored
    end

    def call
      if is_sponsored
        return {
          code: 'SPONSORED_PLACEMENT',
          label: 'Destaque institucional'
        }
      end

      if context.local?
        if company.state == context.state && company.city.to_s.strip.downcase == context.city.to_s.strip.downcase
          return {
            code: 'LOCAL_COVERAGE',
            label: "Sede em #{company.city}, #{company.state}"
          }
        elsif company.company_service_areas.any? { |sa| sa.covers?(city: context.city, state: context.state) }
          return {
            code: 'LOCAL_COVERAGE',
            label: "Atende #{context.city} e região"
          }
        end
      end

      if context.state.present? && company.state == context.state
        return {
          code: 'STATE_COVERAGE',
          label: "Atende #{context.state}"
        }
      end

      if company.company_service_areas.any?(&:national_coverage?)
        return {
          code: 'NATIONAL_COVERAGE',
          label: 'Atendimento nacional'
        }
      end

      if company.verified?
        return {
          code: 'VERIFIED_PROFILE',
          label: 'Perfil verificado na Avalia Solar'
        }
      end

      if company.rating_avg.to_f >= 4.5 && company.rating_count.to_i >= 5
        return {
          code: 'HIGH_RATING',
          label: 'Excelente avaliação dos clientes'
        }
      end

      {
        code: 'RECOMMENDED_PROFILE',
        label: 'Empresa recomendada'
      }
    end

    private

    attr_reader :company, :context, :is_sponsored
  end
end
