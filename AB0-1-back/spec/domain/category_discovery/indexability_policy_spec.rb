require 'rails_helper'

RSpec.describe CategoryDiscovery::IndexabilityPolicy do
  describe '.evaluate (CDSI-021..CDSI-029)' do
    it 'R05: returns an immutable IndexabilityDecision for a well-formed active category' do
      category = build(
        :category,
        id: 10,
        name: 'Monitoramento e O&M',
        seo_url: 'monitoramento-operacao-manutencao',
        status: 'active',
        short_description: 'Compare empresas especializadas em monitoramento solar, operação e manutenção preventiva.',
        description: 'Guia completo de monitoramento e operação e manutenção de usinas solares residenciais, comerciais e industriais no Brasil.',
        companies_count: 8
      )

      decision = described_class.evaluate(category)

      expect(decision).to be_a(CategoryDiscovery::IndexabilityDecision)
      expect(decision).to be_frozen
      expect(decision.publicly_accessible?).to be(true)
      expect(decision.indexable?).to be(true)
      expect(decision.include_in_sitemap?).to be(true)
      expect(decision.robots_directive).to eq('index,follow')
      expect(decision.canonical_slug).to eq('monitoramento-operacao-manutencao')
      expect(decision.canonical_path).to eq('/categories/monitoramento-operacao-manutencao')
      expect(decision.reason_codes).to eq([:eligible])
      expect(decision.advisory_warnings).to be_empty
    end

    it 'R05 (legacy fallback): keeps legacy active categories with thin copy or zero companies indexable in shadow mode without mass deindexation' do
      legacy_category = build(
        :category,
        id: 11,
        name: 'Monitoramento e O&M',
        seo_url: 'monitoramento-operacao-manutencao',
        status: 'active',
        short_description: 'Monitoramento e O&M',
        description: 'Monitoramento e O&M',
        companies_count: 0
      )

      decision = described_class.evaluate(legacy_category, enforced: false)

      expect(decision.mode).to eq(:shadow)
      expect(decision.publicly_accessible?).to be(true)
      expect(decision.indexable?).to be(true)
      expect(decision.include_in_sitemap?).to be(true)
      expect(decision.robots_directive).to eq('index,follow')
      expect(decision.reason_codes).to include(:legacy_active_fallback)
      expect(decision.advisory_warnings).to include(:thin_editorial_copy, :empty_without_editorial_utility)
    end

    it 'R06: in enforced mode, marks empty category without editorial utility as noindex,follow while keeping publicly_accessible true (200)' do
      empty_category = build(
        :category,
        id: 12,
        name: 'Categoria Vazia',
        seo_url: 'categoria-vazia',
        status: 'active',
        short_description: 'Categoria Vazia',
        description: 'Categoria Vazia',
        companies_count: 0
      )

      decision = described_class.evaluate(empty_category, enforced: true)

      expect(decision.mode).to eq(:enforced)
      expect(decision.publicly_accessible?).to be(true)
      expect(decision.indexable?).to be(false)
      expect(decision.include_in_sitemap?).to be(false)
      expect(decision.robots_directive).to eq('noindex,follow')
      expect(decision.reason_codes).to include(:empty_without_editorial_utility)
    end

    it 'R07: marks inactive or nil categories as not publicly accessible and noindex,nofollow' do
      inactive_category = build(
        :category,
        id: 13,
        name: 'Categoria Inativa',
        seo_url: 'categoria-inativa',
        status: 'inactive',
        companies_count: 5
      )

      inactive_decision = described_class.evaluate(inactive_category)
      expect(inactive_decision.publicly_accessible?).to be(false)
      expect(inactive_decision.indexable?).to be(false)
      expect(inactive_decision.include_in_sitemap?).to be(false)
      expect(inactive_decision.robots_directive).to eq('noindex,nofollow')
      expect(inactive_decision.reason_codes).to eq([:inactive])

      nil_decision = described_class.evaluate(nil)
      expect(nil_decision.publicly_accessible?).to be(false)
      expect(nil_decision.reason_codes).to eq([:not_found])
    end

    it 'R08: rejects invalid or non-canonical seo_url slugs' do
      bad_slug_category = build(
        :category,
        id: 14,
        name: 'Slug Inválido',
        seo_url: '../admin/secret',
        status: 'active'
      )

      decision = described_class.evaluate(bad_slug_category)

      expect(decision.publicly_accessible?).to be(false)
      expect(decision.indexable?).to be(false)
      expect(decision.include_in_sitemap?).to be(false)
      expect(decision.reason_codes).to eq([:invalid_slug])
    end

    it 'CDSI-026: separates operational status from optional editorial_status without breaking legacy models' do
      category = build(
        :category,
        id: 15,
        name: 'Energia Solar Rural',
        seo_url: 'energia-solar-rural',
        status: 'active',
        short_description: 'Soluções completas de energia solar para propriedades rurais, irrigação e agronegócio.',
        description: 'Compare empresas especializadas em energia solar rural e projetos fotovoltaicos para agronegócio em todo o Brasil.',
        companies_count: 4
      )
      allow(category).to receive(:respond_to?).and_call_original
      allow(category).to receive(:respond_to?).with(:editorial_status, any_args).and_return(true)
      allow(category).to receive(:editorial_status).and_return('draft')

      decision = described_class.evaluate(category, enforced: false)

      expect(decision.publicly_accessible?).to be(true)
      expect(decision.advisory_warnings).to include(:unpublished_editorial_draft)
    end
  end
end

