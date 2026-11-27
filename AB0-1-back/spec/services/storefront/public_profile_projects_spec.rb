# frozen_string_literal: true

require 'rails_helper'

# Spec 027 — T017: a vitrine lista os projetos publicados (`company_projects`)
# e respeita o entitlement `projects_showcase` do plano.
RSpec.describe Storefront::PublicProfileService, 'projetos da vitrine' do
  let(:pro_plan) { create(:plan, name: 'Plano Pro Vitrine', price: 1500, features_json: {}) }
  let(:company) { create(:company, plan: pro_plan, slug: "vitrine-#{SecureRandom.hex(3)}") }

  def publish_project(company, **attrs)
    create(:company_project, company: company, status: 'published', published_at: 1.day.ago, **attrs)
  end

  it 'mostra os projetos publicados de uma empresa Pro (caso WEG: 1 projeto publicado)' do
    publish_project(company, title: 'Usina Jaraguá', capacity_value: 75.5, city: 'Jaraguá do Sul', state: 'SC',
                             completion_date: Date.new(2025, 6, 1))
    create(:company_project, company: company, status: 'draft')

    projects = described_class.call(slug: company.slug)[:data][:projects]

    expect(projects.size).to eq(1)
    expect(projects.first).to include(title: 'Usina Jaraguá', power_kwp: 75.5, city: 'Jaraguá do Sul', uf: 'SC',
                                      completion_year: 2025, photo_urls: [])
  end

  it 'limita a 6 projetos na ordem definida pela empresa' do
    7.times { |i| publish_project(company, position: 7 - i, title: "Projeto #{i}") }

    titles = described_class.call(slug: company.slug)[:data][:projects].pluck(:title)

    expect(titles.size).to eq(6)
    expect(titles.first).to eq('Projeto 6')
  end

  it 'não mostra projetos quando o plano não libera projects_showcase' do
    free_plan = create(:plan, name: "Free #{SecureRandom.hex(3)}", price: 0, features_json: {})
    company.update!(plan: free_plan)
    publish_project(company)

    expect(company.reload.feature_enabled?('projects_showcase')).to be(false)
    expect(described_class.call(slug: company.slug)[:data][:projects]).to eq([])
  end

  it 'aceita a empresa já carregada (uso pela ferramenta MCP)' do
    publish_project(company)

    payload = described_class.new(company: company).call

    expect(payload[:data][:company][:id]).to eq(company.id)
    expect(payload[:data][:projects].size).to eq(1)
  end
end
