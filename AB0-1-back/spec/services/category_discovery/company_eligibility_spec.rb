# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CategoryDiscovery::CompanyEligibilityPolicy do
  let(:category) { create(:category, name: 'Monitoramento e O&M', seo_url: 'monitoramento-operacao-manutencao', status: 'active') }

  describe 'R31 & R32: SaaS monitoring vs Field O&M capability segmentation' do
    let(:saas_company) { create(:company, name: 'SolarView SaaS', status: 'active') }
    let(:field_om_company) { create(:company, name: 'Equipe O&M Campo Sul', status: 'active') }

    before do
      category.companies << [saas_company, field_om_company]

      CompanyCategoryCapability.create!(
        company: saas_company,
        category: category,
        capability_type: 'monitoring_software',
        service_delivery_mode: 'saas',
        curation_status: 'verified',
        verified: true
      )

      CompanyCategoryCapability.create!(
        company: field_om_company,
        category: category,
        capability_type: 'field_om',
        service_delivery_mode: 'field_service',
        curation_status: 'verified',
        verified: true
      )
    end

    it 'returns only SaaS companies when filtering by capability_type=monitoring_software or delivery_mode=saas' do
      scope = described_class.eligible_companies_scope(
        category: category,
        capability_type: 'monitoring_software'
      )

      expect(scope.pluck(:id)).to eq([saas_company.id])
    end

    it 'returns only Field O&M companies when filtering by capability_type=field_om' do
      scope = described_class.eligible_companies_scope(
        category: category,
        capability_type: 'field_om'
      )

      expect(scope.pluck(:id)).to eq([field_om_company.id])
    end
  end

  describe 'R33: Inactive companies are excluded from public category listing and counts' do
    it 'excludes companies with status != active' do
      active_co = create(:company, status: 'active')
      inactive_co = create(:company, status: 'inactive')
      category.companies << [active_co, inactive_co]

      scope = described_class.eligible_companies_scope(category: category)
      expect(scope.pluck(:id)).to include(active_co.id)
      expect(scope.pluck(:id)).not_to include(inactive_co.id)
    end
  end

  describe 'R35: Deterministic organic ordering separated from commercial sponsored flag' do
    it 'orders organically by rating_avg DESC, rating_count DESC, id ASC regardless of featured/sponsored flag' do
      sponsored_low_rating = create(:company, status: 'active', featured: true, rating_avg: 3.5, rating_count: 2)
      organic_high_rating = create(:company, status: 'active', featured: false, rating_avg: 4.9, rating_count: 25)
      category.companies << [sponsored_low_rating, organic_high_rating]

      ordered = described_class.apply_organic_order(
        described_class.eligible_companies_scope(category: category),
        sort: 'rating_desc'
      )

      expect(ordered.map(&:id)).to eq([organic_high_rating.id, sponsored_low_rating.id])
    end
  end

  describe 'R38: Public capability DTO never leaks internal curation notes or PII' do
    it 'serializes only safe public capability fields' do
      company = create(:company, status: 'active')
      cap = CompanyCategoryCapability.create!(
        company: company,
        category: category,
        capability_type: 'inspection',
        service_delivery_mode: 'field_service',
        curation_status: 'verified',
        verified: true,
        curated_by_id: 99,
        evidence_json: { 'internal_reviewer_email' => 'auditor@avaliasolar.com.br', 'contract_doc' => 'secret.pdf' }
      )

      serialized = described_class.serialize_public_capability(cap)
      expect(serialized).to include(
        capability_type: 'inspection',
        service_delivery_mode: 'field_service',
        verified: true
      )
      expect(serialized.keys).not_to include(:evidence_json, :curated_by_id, 'evidence_json', 'curated_by_id')
    end
  end
end

