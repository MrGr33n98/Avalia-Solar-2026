# frozen_string_literal: true

module Storefront
  class PublicProfileService
    class NotFoundError < StandardError; end

    attr_reader :slug

    def self.call(slug:)
      new(slug: slug).call
    end

    def initialize(slug:)
      @slug = slug.to_s.strip.downcase
    end

    def call
      company = find_active_company
      build_payload(company)
    end

    private

    def find_active_company
      company = ::Company.find_by(slug: slug, status: 'active')
      raise NotFoundError, "Empresa com slug '#{slug}' não encontrada ou inativa" unless company

      company
    end

    def build_payload(company)
      {
        schema_version: 'v1',
        data_as_of: Time.current.iso8601,
        source_type: 'avalia_solar_verified_storefront',
        data: {
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            verified: company.respond_to?(:verified?) ? company.verified? : company.verified.present?,
            logo_url: company.respond_to?(:logo_url) ? company.logo_url : nil,
            headquarters: {
              city: company.city.presence || 'Brasil',
              state: company.state.presence || 'BR'
            },
            rating: company.respond_to?(:average_rating) ? company.average_rating&.to_f : nil,
            review_count: company.respond_to?(:reviews_count) ? (company.reviews_count || 0) : 0
          },
          settings: build_settings(company),
          projects: build_projects(company),
          curated_products: build_products(company)
        },
        limitations: [
          'Informações sujeitas à disponibilidade regional e viabilidade técnica da distribuidora local.'
        ]
      }
    end

    def build_settings(company)
      headline = company.description.present? ? company.description.truncate(120) : "Soluções solares com #{company.name}"
      {
        headline: headline,
        cta_label: 'Solicitar Orçamento',
        show_calculator: true,
        featured_brands: [],
        direct_quote_enabled: true
      }
    end

    def build_projects(company)
      return [] unless company.respond_to?(:projects)

      company.projects.limit(6).map do |p|
        {
          id: p.id,
          title: p.respond_to?(:title) ? p.title : "Projeto #{p.id}",
          power_kwp: p.respond_to?(:power_kwp) ? p.power_kwp.to_f : 0.0,
          city: p.respond_to?(:city) ? (p.city || company.city) : company.city,
          uf: p.respond_to?(:state) ? (p.state || company.state) : company.state,
          photo_urls: p.respond_to?(:photo_urls) ? Array(p.photo_urls) : [],
          completion_year: p.respond_to?(:completion_date) && p.completion_date ? p.completion_date.year : Time.current.year
        }
      end
    rescue StandardError => e
      Rails.logger.warn("[Storefront::PublicProfileService] Falha ao carregar projetos da empresa #{company.id}: #{e.message}")
      []
    end

    def build_products(company)
      return [] unless company.respond_to?(:products)

      company.products.limit(10).map do |prod|
        {
          id: prod.id,
          category: prod.respond_to?(:category_name) ? prod.category_name : 'Solar',
          brand: prod.respond_to?(:brand) ? prod.brand : company.name,
          model: prod.respond_to?(:name) ? prod.name : "Produto #{prod.id}",
          warranty_years: prod.respond_to?(:warranty_years) ? prod.warranty_years : nil
        }
      end
    rescue StandardError => e
      Rails.logger.warn("[Storefront::PublicProfileService] Falha ao carregar produtos da empresa #{company.id}: #{e.message}")
      []
    end
  end
end
