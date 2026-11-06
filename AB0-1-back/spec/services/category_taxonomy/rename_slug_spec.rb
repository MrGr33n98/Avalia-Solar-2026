# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Category Taxonomy — Slug Stability, Redirect History & Chain Resolution (R14–R17)', type: :model do
  let(:category) do
    Category.create!(
      name: 'Inversores Solares',
      seo_url: 'inversores-solares',
      description: 'Categoria de inversores solares para sistemas fotovoltaicos.',
      status: 'active',
      kind: 'main'
    )
  end

  describe 'R14 — Name change preserves published seo_url' do
    it 'preserves seo_url when category name is updated normally' do
      category.update!(name: 'Inversores Fotovoltaicos Híbridos')
      expect(category.reload.seo_url).to eq('inversores-solares')
    end

    it 'generates seo_url on create if blank, and prevents clearing it once persisted' do
      new_cat = Category.create!(
        name: 'Microinversores Residenciais',
        seo_url: nil,
        description: 'Microinversores de alta eficiência.',
        status: 'active',
        kind: 'sub'
      )
      expect(new_cat.seo_url).to eq('microinversores-residenciais')

      new_cat.update!(name: 'Microinversores Solares Residenciais', seo_url: '')
      expect(new_cat.reload.seo_url).to eq('microinversores-residenciais')
    end
  end

  describe 'R15 — Explicit slug rename records unique redirect without loop' do
    it 'renames seo_url and creates a CategorySlugRedirect pointing to the category' do
      result = CategoryTaxonomy::RenameSlug.call(
        category: category,
        new_slug: 'inversores-fotovoltaicos',
        reason: 'Reestruturação editorial SEO'
      )

      expect(result).to be_success
      expect(category.reload.seo_url).to eq('inversores-fotovoltaicos')

      redirect_record = CategorySlugRedirect.find_by(source_slug: 'inversores-solares')
      expect(redirect_record).to be_present
      expect(redirect_record.category_id).to eq(category.id)
      expect(redirect_record.http_status).to eq(308)
    end

    it 'removes self-redirect if renamed back to a previously used historical slug (no loop)' do
      CategoryTaxonomy::RenameSlug.call(category: category, new_slug: 'inversores-fotovoltaicos')
      CategoryTaxonomy::RenameSlug.call(category: category, new_slug: 'inversores-solares')

      expect(category.reload.seo_url).to eq('inversores-solares')
      expect(CategorySlugRedirect.find_by(source_slug: 'inversores-solares')).to be_nil
      expect(CategorySlugRedirect.find_by(source_slug: 'inversores-fotovoltaicos')&.category_id).to eq(category.id)
    end
  end

  describe 'R16 — Multi-rename chain resolves in 1 hop to final canonical slug' do
    it 'points all historical slugs of the category directly to the current seo_url' do
      CategoryTaxonomy::RenameSlug.call(category: category, new_slug: 'inversores-v2')
      CategoryTaxonomy::RenameSlug.call(category: category, new_slug: 'inversores-v3')

      resolved_v1 = CategorySlugRedirect.resolve('inversores-solares')
      resolved_v2 = CategorySlugRedirect.resolve('inversores-v2')

      expect(resolved_v1).to be_present
      expect(resolved_v1.seo_url).to eq('inversores-v3')
      expect(resolved_v2.seo_url).to eq('inversores-v3')
    end
  end

  describe 'R17 — Prevents slug collision with active category or another category redirect' do
    let!(:other_category) do
      Category.create!(
        name: 'Painéis Solares',
        seo_url: 'paineis-solares',
        description: 'Módulos fotovoltaicos.',
        status: 'active',
        kind: 'main'
      )
    end

    it 'rejects renaming to an existing category seo_url' do
      result = CategoryTaxonomy::RenameSlug.call(
        category: category,
        new_slug: 'paineis-solares'
      )

      expect(result).not_to be_success
      expect(result.errors).to include(match(/já está em uso/i))
      expect(category.reload.seo_url).to eq('inversores-solares')
    end

    it 'rejects creating a CategorySlugRedirect whose source_slug matches an active category seo_url' do
      invalid_redirect = CategorySlugRedirect.new(
        source_slug: 'paineis-solares',
        category: category,
        http_status: 308
      )

      expect(invalid_redirect).not_to be_valid
      expect(invalid_redirect.errors[:source_slug]).to be_present
    end
  end
end

