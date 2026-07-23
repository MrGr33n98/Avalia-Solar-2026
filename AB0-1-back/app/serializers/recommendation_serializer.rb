# frozen_string_literal: true

class RecommendationSerializer
  def self.render(results:, context:, request_id:)
    new(results: results, context: context, request_id: request_id).render
  end

  def initialize(results:, context:, request_id:)
    @results = Array(results)
    @context = context
    @request_id = request_id
  end

  def render
    sponsored_count = @results.count(&:sponsored?)
    organic_count = @results.size - sponsored_count

    {
      meta: {
        request_id: @request_id,
        recommendation_version: Recommendation::OrganicScorer::ALGORITHM_VERSION,
        generated_at: Time.current.iso8601,
        location: {
          city: @context.city,
          state: @context.state,
          source: @context.location_source.to_s,
          confidence: @context.local? ? 1.0 : (@context.state_only? ? 0.8 : 0.5)
        },
        filters: {
          category_slug: @context.category_slug,
          segment: @context.segment
        },
        slots: {
          total: @results.size,
          organic_count: organic_count,
          sponsored_count: sponsored_count
        }
      },
      data: @results.map { |res| serialize_result(res) }
    }
  end

  private

  def serialize_result(res)
    company = res.company
    rating_avg = company.rating_avg.to_f
    rating_cnt = company.rating_count.to_i

    rating_label = if rating_cnt > 0 && rating_avg > 0
                     "#{rating_avg.round(1).to_s.gsub('.', ',')} (#{rating_cnt} #{rating_cnt == 1 ? 'avaliação' : 'avaliações'})"
                   else
                     'Sem avaliações'
                   end

    response_sla = company.response_time_sla.presence
    response_label = response_sla ? "Responde em até #{response_sla}" : 'Tempo de resposta não informado'

    projects_cnt = company.delivered_projects_score.to_i
    projects_label = projects_cnt > 0 ? "#{projects_cnt} projetos verificados" : 'Não informado'

    logo_url = company.logo_url
    if logo_url.blank? && company.logo.attached?
      logo_url = Rails.application.routes.url_helpers.rails_blob_url(company.logo, only_path: true) rescue nil
    end

    {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo_url: logo_url,
      segment: company.segment,
      comparable_group: res.comparison_group,
      verified: company.verified?,
      sponsored: res.sponsored?,
      recommendation_reason: res.recommendation_reason,
      coverage: {
        type: company.company_service_areas.first&.coverage_type || 'local',
        label: res.recommendation_reason[:label]
      },
      rating: {
        average: rating_cnt > 0 ? rating_avg.round(1) : nil,
        count: rating_cnt,
        label: rating_label
      },
      response_time: {
        value: response_sla,
        label: response_label
      },
      projects: {
        count: projects_cnt > 0 ? projects_cnt : nil,
        label: projects_label
      },
      primary_cta: res.primary_cta,
      secondary_cta: res.secondary_cta,
      comparison: {
        enabled: true,
        group: res.comparison_group
      },
      ranking: {
        position: res.final_position,
        organic_score: res.organic_score,
        sponsored: res.sponsored?
      }
    }
  end
end
