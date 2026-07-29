# frozen_string_literal: true

module Chat
  module Mobivolt
    class SafeCompanySerializer
      BOOLEAN_TYPE = ActiveModel::Type::Boolean.new.freeze

      def self.serialize(company)
        new(company).serialize
      end

      def initialize(company)
        @company = company
      end

      def serialize
        return {} if @company.nil?

        basic_info.merge(metrics_and_links)
                  .merge(recommendation_data)
                  .merge(additional_info)
      rescue StandardError => e
        error_msg = "[Chat::Mobivolt::SafeCompanySerializer] Error serializing company #{@company&.id}: #{e.message}"
        Rails.logger.error(error_msg)
        {}
      end

      private

      def basic_info
        {
          id: @company.id,
          nome: @company.name,
          cidade: @company.city,
          estado: @company.state
        }
      end

      def metrics_and_links
        {
          nota_media: @company.rating_avg&.to_f&.round(2),
          total_avaliacoes: @company.rating_count || 0,
          link_perfil: "https://www.avaliasolar.com.br/companies/#{@company.slug}"
        }
      end

      def recommendation_data
        {
          patrocinada: boolean_flag(@company.sponsored),
          verificada: boolean_flag(@company.verified),
          recommendation_score: recommendation_score,
          recommendation_reason: build_recommendation_reason
        }
      end

      def additional_info
        {
          servicos: Array(@company.services_offered),
          nichos: Array(@company.niche_tags),
          logo_url: company_attribute(:logo_url),
          warranty_years: company_attribute(:warranty_years),
          has_financing: boolean_flag(company_attribute(:financing_enabled)),
          years_in_business: years_in_business,
          post_sales_support: boolean_flag(company_attribute(:post_sales_support))
        }
      end

      def boolean_flag(value)
        BOOLEAN_TYPE.cast(value) || false
      end

      def company_attribute(attr_name)
        @company.respond_to?(attr_name) ? @company.public_send(attr_name) : nil
      end

      def recommendation_score
        return nil unless @company.respond_to?(:calculate_ranking_score)

        @company.calculate_ranking_score.to_f.round(2)
      end

      def years_in_business
        return nil unless @company.respond_to?(:founded_year) && @company.founded_year

        Date.today.year - @company.founded_year
      end

      def build_recommendation_reason
        reasons = []
        reasons << 'Empresa Destaque/Patrocinada' if boolean_flag(@company.sponsored)
        reasons << 'Instalador Verificado com selo de confiança' if boolean_flag(@company.verified)
        reasons << "Excelente reputação com nota #{@company.rating_avg}" if @company.rating_avg.to_f >= 4.5
        reasons << "Especialista em #{@company.niche_tags.first}" if @company.niche_tags.present?

        reasons.join(' • ').presence
      end
    end
  end
end
