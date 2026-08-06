require 'rails_helper'

RSpec.describe CompanyCatalogBuilder, type: :service do
  let!(:company) { create(:company, status: :active) }
  let!(:other_company) { create(:company, status: :active) }
  let!(:category) { create(:category, name: 'Carregadores Veiculares', seo_url: 'carregadores-veiculares') }
  let!(:other_category) { create(:category, name: 'Baterias', seo_url: 'baterias') }

  describe '#call' do
    context 'when category has products and services' do
      let!(:global_product) do
        create(:product, name: 'Wallbox Global', company: other_company).tap do |product|
          product.categories << category
        end
      end

      before do
        company.categories << category
        CompanyProduct.create!(
          company: company,
          product: global_product,
          relationship_type: 'distributor',
          status: 'active'
        )
        CompanyService.create!(
          company: company,
          category: category,
          name: 'Instalação de wallbox',
          slug: 'instalacao-de-wallbox',
          status: 'active'
        )
      end

      it 'returns products and services in the requested category' do
        result = described_class.new(company: company, category: category).call

        expect(result[:products].map(&:id)).to contain_exactly(global_product.id)
        expect(result[:services].map(&:slug)).to contain_exactly('instalacao-de-wallbox')
        expect(result[:suggested_products]).to be_empty
        expect(result[:related_categories]).to be_empty
        expect(result[:similar_companies]).to be_empty
      end
    end

    context 'when category is empty but company has products elsewhere' do
      let!(:empty_category) { create(:category, name: 'Carregadores Residenciais', seo_url: 'carregadores-residenciais') }
      let!(:suggested_product) do
        create(:product, name: 'Weg Inversor', company: company).tap do |product|
          product.categories << other_category
        end
      end

      before do
        company.categories << empty_category
        company.categories << other_category
      end

      it 'returns suggested products from other categories' do
        result = described_class.new(company: company, category: empty_category).call

        expect(result[:products]).to be_empty
        expect(result[:services]).to be_empty
        expect(result[:suggested_products].map(&:id)).to contain_exactly(suggested_product.id)
      end

      it 'returns related categories with product counts' do
        result = described_class.new(company: company, category: empty_category).call

        related = result[:related_categories]
        expect(related.map { |c| c[:seo_url] }).to include(other_category.seo_url)
        battery = related.find { |c| c[:id] == other_category.id }
        expect(battery[:product_count]).to eq(1)
      end
    end

    context 'when company has no products and similar companies exist' do
      let!(:empty_category) { create(:category, name: 'Carregadores Residenciais', seo_url: 'carregadores-residenciais') }
      let!(:competitor_product) do
        create(:product, name: 'Concorrente Wallbox', company: other_company).tap do |product|
          product.categories << empty_category
        end
      end

      before do
        company.categories << empty_category
      end

      it 'returns similar companies for free sellers' do
        result = described_class.new(company: company, category: empty_category).call

        expect(result[:products]).to be_empty
        expect(result[:suggested_products]).to be_empty
        expect(result[:similar_companies].map { |c| c[:id] }).to include(other_company.id)
      end

      it 'does not return similar companies for verified sellers' do
        company.update!(verified: true)

        result = described_class.new(company: company, category: empty_category).call

        expect(result[:similar_companies]).to be_empty
      end

      it 'does not return similar companies for featured sellers' do
        company.update!(featured: true, status: :active)

        result = described_class.new(company: company, category: empty_category).call

        expect(result[:similar_companies]).to be_empty
      end
    end
  end
end
