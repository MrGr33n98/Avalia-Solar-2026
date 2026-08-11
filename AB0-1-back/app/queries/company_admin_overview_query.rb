# frozen_string_literal: true

class CompanyAdminOverviewQuery
  def initialize(company)
    @company = company
  end

  def call
    {
      active_products: CompanyProduct.where(company: @company).where(status: 'active').count,
      published_projects: CompanyProject.where(company: @company).published.count,
      services: CompanyService.where(company: @company).count,
      materials: CompanyMaterial.where(company: @company).count,
      faqs: CompanyFaq.where(company: @company).count,
      members: CompanyMember.where(company: @company).count,
      pending_access_requests: CompanyAccessRequest.where(company: @company).pending.count,
      recent_leads: Lead.where(company: @company).where('created_at >= ?', 30.days.ago).count,
      active_campaigns: active_campaigns_count,
      average_rating: @company.reviews.approved.average(:rating).to_f.round(2)
    }
  end

  private

  def active_campaigns_count
    now = Time.current
    Campaign.where(company: @company)
            .where('start_date <= ? AND (end_date IS NULL OR end_date >= ?)', now, now)
            .count
  end
end
