require 'rails_helper'

RSpec.describe CategoryDiscovery::SitemapExporter do
  before { Category.destroy_all }

  describe '.call (CDSI-031, CDSI-036)' do
    it 'R18: exports only active and sitemap-eligible categories with canonical path and lastmod' do
      active_cat = create(
        :category,
        status: 'active',
        seo_url: 'inversores-solares',
        name: 'Inversores Solares',
        short_description: 'Compare marcas e fornecedores de inversores solares homologados no Brasil.',
        companies_count: 4
      )
      create(
        :category,
        status: 'inactive',
        seo_url: 'categoria-inativa-sitemap',
        name: 'Categoria Inativa'
      )

      result = described_class.call(limit: 50)

      slugs = result[:data].map { |item| item[:slug] }
      expect(slugs).to include('inversores-solares')
      expect(slugs).not_to include('categoria-inativa-sitemap')

      entry = result[:data].find { |item| item[:id] == active_cat.id }
      expect(entry[:canonical_path]).to eq('/categories/inversores-solares')
      expect(entry[:lastmod]).to be_present
    end

    it 'R19/R20: paginates deterministically by id cursor without duplicates or gaps and caps limit at 500' do
      cat1 = create(:category, status: 'active', seo_url: 'cat-cursor-1', name: 'Cat 1', companies_count: 2)
      cat2 = create(:category, status: 'active', seo_url: 'cat-cursor-2', name: 'Cat 2', companies_count: 2)
      cat3 = create(:category, status: 'active', seo_url: 'cat-cursor-3', name: 'Cat 3', companies_count: 2)

      page1 = described_class.call(cursor: nil, limit: 2)
      expect(page1[:data].map { |c| c[:id] }).to eq([cat1.id, cat2.id])
      expect(page1[:meta][:has_more]).to be(true)
      expect(page1[:meta][:next_cursor]).to eq(cat2.id)

      page2 = described_class.call(cursor: page1[:meta][:next_cursor], limit: 2)
      expect(page2[:data].map { |c| c[:id] }).to eq([cat3.id])
      expect(page2[:meta][:has_more]).to be(false)
      expect(page2[:meta][:next_cursor]).to be_nil

      capped = described_class.call(limit: 5_000)
      expect(capped[:meta][:limit]).to eq(500)
    end

    it 'R21/R22/R23: increment_views_without_touch! does not alter updated_at or sitemap lastmod' do
      frozen_time = Time.utc(2026, 10, 15, 12, 0, 0)
      cat = create(
        :category,
        status: 'active',
        seo_url: 'paineis-solares',
        name: 'Painéis Solares',
        companies_count: 3,
        views_count: 10,
        updated_at: frozen_time
      )

      before_export = described_class.call(limit: 10)[:data].find { |c| c[:id] == cat.id }
      cat.increment_views_without_touch!
      after_export = described_class.call(limit: 10)[:data].find { |c| c[:id] == cat.id }

      expect(cat.reload.views_count).to eq(11)
      expect(after_export[:lastmod]).to eq(before_export[:lastmod])
    end
  end
end

