# frozen_string_literal: true

class MarketplaceProposalSerializer < ActiveModel::Serializer
  CANONICAL_STATUSES = %w[
    draft
    sent
    viewed
    negotiating
    accepted
    project_in_progress
    completed
  ].freeze

  attributes :id, :reference, :status, :canonical_status, :revision_pending, :total_cents, :currency,
             :expires_at, :published_at, :created_at, :company, :request, :version, :versions, :project, :meetings

  def status
    resolved_status
  end

  def canonical_status
    resolved_status
  end

  def revision_pending
    object.status == 'draft' && published_versions.any?
  end

  def company
    {
      id: object.company_id,
      name: object.company&.name,
      logo_url: object.company.try(:logo_url),
      slug: object.company&.slug,
      verified: object.company&.verified? || false,
      rating_avg: object.company&.rating_avg,
      reviews_count: object.company&.reviews_count,
      city: object.company&.city,
      state: object.company&.state,
      founded_year: object.company&.founded_year
    }
  end

  def request
    return nil unless object.lead

    {
      id: object.lead.id,
      vertical: object.lead.product_vertical,
      project_profile: object.lead.project_profile,
      city: object.lead.city,
      state: object.lead.state,
      created_at: object.lead.created_at
    }
  end

  def version
    version_json(published_versions.first)
  end

  def versions
    published_versions.map { |v| version_json(v) }
  end

  def project
    return nil unless object.project

    {
      id: object.project.id,
      status: object.project.status,
      started_at: object.project.started_at,
      completed_at: object.project.completed_at,
      milestones: object.project.milestones.sort_by { |m| [m.position, m.id] }.map do |m|
        m.as_json(only: %i[id key title status position scheduled_at completed_at notes])
      end
    }
  end

  def meetings
    object.meetings.sort_by(&:created_at).reverse.map do |m|
      m.as_json(only: %i[id meeting_type status scheduled_at notes created_at])
    end
  end

  private

  def resolved_status
    if object.project.present?
      return 'completed' if object.project.status == 'completed'
      return 'project_in_progress' if %w[in_progress started].include?(object.project.status)
    end

    return 'negotiating' if revision_pending || object.status == 'meeting_scheduled' || object.status == 'under_review'

    CANONICAL_STATUSES.include?(object.status) ? object.status : 'sent'
  end

  def published_versions
    @published_versions ||= object.versions.select { |v| v.status == 'published' }.sort_by(&:number).reverse
  end

  def version_json(ver)
    return nil unless ver

    {
      id: ver.id,
      number: ver.number,
      status: ver.status,
      title: ver.title,
      summary: ver.summary,
      total_cents: ver.total_cents,
      currency: ver.currency,
      valid_until: ver.valid_until,
      published_at: ver.published_at,
      items: ver.items.sort_by { |item| [item.position, item.id] }.map do |item|
        item.as_json(only: %i[id kind name description quantity unit unit_price_cents total_cents position])
      end,
      terms: ver.terms.sort_by { |term| [term.position, term.id] }.map do |term|
        term.as_json(only: %i[id key label value position])
      end
    }
  end
end
