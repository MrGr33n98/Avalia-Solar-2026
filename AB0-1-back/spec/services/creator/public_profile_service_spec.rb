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

    it 'funciona para creator sem avaliações' do
      expect { described_class.new(profile).call }.not_to raise_error
      expect(described_class.new(profile).call[:recent_reviews]).to eq([])
    end
  end
end
