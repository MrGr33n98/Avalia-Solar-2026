# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::ProjectPortfolioSnapshot do
  let(:company) { create(:company, status: :active) }

  it 'returns no public projects without the existing plan feature' do
    allow(company).to receive(:feature_enabled?).with('projects_showcase').and_return(false)
    create(:company_project, company: company, status: 'published', published_at: 1.minute.ago)
    expect(described_class.call(company)).to eq(state: 'unavailable', items: [], has_more: false)
  end

  it 'limits the preview and excludes drafts, future publication and other companies' do
    allow(company).to receive(:feature_enabled?).with('projects_showcase').and_return(true)
    public_projects = create_list(:company_project, 4, company: company, status: 'published',
                                   published_at: 1.minute.ago)
    create(:company_project, company: company, status: 'draft')
    create(:company_project, company: company, status: 'published', published_at: 1.day.from_now)
    create(:company_project, status: 'published', published_at: 1.minute.ago)
    result = described_class.call(company)
    expect(result).to include(state: 'ready', has_more: true)
    expect(result[:items].size).to eq(3)
    expect(result[:items].map { |item| item[:id] } - public_projects.map(&:id)).to be_empty
    expect(result[:items].map { |item| item[:cover_url] }).to eq([nil, nil, nil])
    expect(result[:items].map { |item| item[:gallery_images] }).to eq([[], [], []])
  end

  it 'returns an empty ready state for an eligible company with no projects' do
    allow(company).to receive(:feature_enabled?).with('projects_showcase').and_return(true)
    expect(described_class.call(company)).to eq(state: 'ready', items: [], has_more: false)
  end
end
