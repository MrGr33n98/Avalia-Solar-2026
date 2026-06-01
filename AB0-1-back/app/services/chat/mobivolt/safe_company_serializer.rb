# frozen_string_literal: true

module Chat
  module Mobivolt
    class SafeCompanySerializer
      def self.serialize(company)
        new(company).serialize
      end

      def initialize(company)
        @company = company
      end

      def serialize
        return {} if @company.nil?

        {
          id: @company.id,
          nome: @company.name,
          cidade: @company.city,
          estado: @company.state,
          nota_media: @company.rating_avg ? @company.rating_avg.to_f.round(2) : nil,
          total_avaliacoes: @company.rating_count || 0,
          link_perfil: "https://www.avaliasolar.com.br/companies/#{@company.slug}",
          patrocinada: !!@company.sponsored,
          verificada: !!@company.verified,
          recommendation_score: @company.respond_to?(:calculate_ranking_score) ? @company.calculate_ranking_score.to_f.round(2) : nil,
          recommendation_reason: build_recommendation_reason,
          servicos: Array(@company.services_offered),
          nichos: Array(@company.niche_tags),
          logo_url: @company.respond_to?(:logo_url) ? @company.logo_url : nil
        }
      rescue StandardError => e
        Rails.logger.error("[Chat::Mobivolt::SafeCompanySerializer] Error serializing company #{@company&.id}: #{e.message}")
        {}
      end

      private

      def build_recommendation_reason
        reasons = []
        reasons << "Empresa Destaque/Patrocinada" if @company.sponsored
        reasons << "Instalador Verificado com selo de confiança" if @company.verified
        reasons << "Excelente reputação com nota #{@company.rating_avg}" if @company.rating_avg.to_f >= 4.5
        reasons << "Especialista em #{@company.niche_tags.first}" if @company.niche_tags.present?
        
        reasons.join(" • ").presence
      end
    end
  end
end
