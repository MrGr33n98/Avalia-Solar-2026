# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerPlacements::Catalog do
  it 'cobre todas as posições aceitas pelo modelo Banner' do
    expect(described_class.keys).to match_array(Banner::ALLOWED_POSITIONS)
  end

  it 'mantem dimensões comerciais positivas e status conhecido' do
    described_class.all.each do |entry|
      expect(entry.dimensions).to all(be > 0)
      expect(entry.status).to be_in(%w[active planned])
    end
  end

  it 'mapeia rotas reais dos consumidores web' do
    expect(described_class.fetch('search_top').routes).to include('/search*')
    expect(described_class.fetch('search_mid').routes).to include('/search*')
    expect(described_class.fetch('article_footer_cta').routes).to include('/blog/*')
    expect(described_class.fetch('sidebar').routes).to include('/blog/*')
    expect(described_class.fetch('sidebar').routes).to include('/companies/:id*')
  end

  it 'marca como ativo somente placement com consumidor real' do
    expect(described_class.fetch('companies_footer').status).to eq('active')
    expect(described_class.fetch('comparison_floating_bar').status).to eq('active')
    expect(described_class.fetch('navbar').status).to eq('active')
    expect(described_class.fetch('financing_simulator_micro_banner').status).to eq('active')
  end
end
