require 'rails_helper'

RSpec.describe Creator::PublicProfileService, type: :service do
  describe '#call' do
    let(:user) { create(:user, name: 'Felipe Henrique') }
    let(:profile) { create(:reviewer_profile, user: user) }
    let(:company) { create(:company, name: 'Solar Empresa', slug: 'solar-empresa') }
    let(:category) { create(:category, name: 'Instalação solar') }

    before do
      allow(Rails.cache).to receive(:fetch).and_wrap_original do |original, key, *args, &block|
        if key.to_s.start_with?('creator/green-score/')
          nil
        else
          original.call(key, *args, &block)
        end
      end
    end

    it 'serializa avaliação pública com autor, empresa e conteúdo completo' do
      review = create(
        :review,
        user: user,
        company: company,
        category: category,
        status: :approved,
        headline: 'Excelente serviço',
        comment: 'Equipe atenciosa e instalação organizada.',
        pros: 'Atendimento rápido',
        cons: 'Prazo poderia ser menor',
        buyer_tip: 'Compare o escopo antes de contratar',
        verified: true,
        project_type: :residential,
        installation_status: :completed,
        estimated_power: 5.5,
        metadata: { 'would_recommend' => true }
      )

      expect { described_class.new(profile).call }.not_to raise_error(ActiveModel::MissingAttributeError)
      result = described_class.new(profile).call[:recent_reviews].first

      expect(result).to include(
        id: review.id,
        headline: 'Excelente serviço',
        comment: 'Equipe atenciosa e instalação organizada.',
        rating: review.rating,
        verified: true,
        project_type: 'residential',
        installation_status: 'completed',
        estimated_power: 5.5,
        buyer_tip: 'Compare o escopo antes de contratar',
        would_recommend: true,
        user: include(id: user.id, name: 'Felipe Henrique', avatar_url: nil),
        company: include(id: company.id, name: 'Solar Empresa', slug: 'solar-empresa')
      )
      expect(result[:pros]).to be_present
      expect(result[:cons]).to be_present
      expect(result[:category_id]).to eq(category.id)
      expect(result[:category_name]).to eq('Instalação solar')
    end

    it 'não expõe avaliações pendentes' do
      create(:review, user: user, company: company, status: :pending)

      expect(described_class.new(profile).call[:recent_reviews]).to be_empty
    end

    it 'normaliza listas editoriais legadas no perfil público' do
      review = create(
        :review,
        user: user,
        company: company,
        category: category,
        status: :approved,
        headline: 'Avaliação legada',
        comment: 'Conteúdo legado',
        pros: ['[]'],
        cons: ['']
      )

      result = described_class.new(profile).call[:recent_reviews].find { |item| item[:id] == review.id }

      expect(result[:pros]).to eq([])
      expect(result[:cons]).to eq([])
    end

    it 'funciona para creator sem avaliações' do
      expect { described_class.new(profile).call }.not_to raise_error
      expect(described_class.new(profile).call[:recent_reviews]).to eq([])
    end

    it 'expõe Tree somente quando há bloco ativo' do
      result = described_class.new(profile).call[:creator]
      expect(result).to include(tree_enabled: false, tree_url: nil)

      create(:creator_tree_block, reviewer: profile, active: true)
      result = described_class.new(profile).call[:creator]

      expect(result).to include(tree_enabled: true, tree_url: "/creators/#{profile.public_slug}/tree")
    end

    it 'projeta apenas marcas ativas com visibilidade pública sem vazar notas privadas' do
      brand1 = create(:brand, name: 'Growatt Solar', slug: 'growatt')
      brand2 = create(:brand, name: 'Marca Privada', slug: 'privada')

      create(
        :reviewer_brand_usage,
        user: user,
        brand: brand1,
        visibility: 'public',
        consent_version: 'v1',
        opted_in_at: Time.current,
        description: 'Nota privada confidencial'
      )
      create(
        :reviewer_brand_usage,
        user: user,
        brand: brand2,
        visibility: 'private'
      )

      result = described_class.new(profile).call[:brands]

      expect(result.map { |b| b[:brand_name] }).to include('Growatt Solar')
      expect(result.map { |b| b[:brand_name] }).not_to include('Marca Privada')
      # Confirma que campos privados não foram expostos
      first_brand = result.first
      expect(first_brand.keys).not_to include(:description, :consent_version, :opted_in_at)
    end

    it 'projeta apenas projetos de portfólio públicos sem vazar projetos privados' do
      brand = create(:brand, name: 'Solis Inverters', slug: 'solis')
      brand_usage = create(:reviewer_brand_usage, user: user, brand: brand, visibility: 'public', consent_version: 'v1', opted_in_at: Time.current)

      public_proj = create(
        :reviewer_portfolio_project,
        user: user,
        title: 'Instalação Solar Pública',
        visibility: 'public',
        consent_version: 'v1'
      )
      public_proj.project_brands.create!(reviewer_brand_usage: brand_usage)

      create(
        :reviewer_portfolio_project,
        user: user,
        title: 'Instalação Confidencial Privada',
        visibility: 'private'
      )

      result = described_class.new(profile).call[:portfolio_projects]

      expect(result.map { |p| p[:title] }).to include('Instalação Solar Pública')
      expect(result.map { |p| p[:title] }).not_to include('Instalação Confidencial Privada')
    end

    it 'invalida o cache público quando invalidate_for_user é invocado' do
      cache_key = "creator/public-profile/#{profile.public_slug}/#{described_class::CACHE_VERSION}"
      Rails.cache.write(cache_key, { cached: true })

      described_class.invalidate_for_user(user)

      expect(Rails.cache.exist?(cache_key)).to be false
    end
  end
end
