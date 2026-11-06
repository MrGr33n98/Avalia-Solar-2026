# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CategoryDiscovery::CacheInvalidationJob, type: :job do
  describe '#perform (R29-R30 / CDSI-107, CDSI-108)' do
    let(:category) { create(:category, name: 'Inversores', seo_url: 'inversores-solares') }

    before do
      Rails.cache.clear
    end

    it 'R29: builds canonical category paths and tags for Next.js revalidation' do
      payload = described_class.build_invalidation_payload(
        slug: category.seo_url,
        previous_slug: 'inversores-antigo'
      )

      expect(payload[:paths]).to include(
        '/categories',
        '/categories/inversores-solares',
        '/categories/inversores-solares/solutions',
        '/categories/inversores-antigo',
        '/sitemaps/categories/sitemap.xml'
      )
      expect(payload[:tags]).to include(
        'categories',
        'category-inversores-solares',
        'category-inversores-antigo',
        'category-solution-types'
      )
    end

    it 'R30: deduplicates rapid successive invalidation calls within the debounce window' do
      allow(described_class).to receive(:dispatch_http_revalidate).and_return(true)

      first_run = described_class.new.perform(category_id: category.id, slug: category.seo_url)
      second_run = described_class.new.perform(category_id: category.id, slug: category.seo_url)

      expect(first_run).to eq(:dispatched)
      expect(second_run).to eq(:deduplicated)
      expect(described_class).to have_received(:dispatch_http_revalidate).once
    end
  end
end

