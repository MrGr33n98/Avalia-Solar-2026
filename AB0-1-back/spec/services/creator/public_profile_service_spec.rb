require 'rails_helper'

RSpec.describe Creator::PublicProfileService, type: :service do
  describe '#call' do
    let(:user) { create(:user, name: 'Felipe Henrique') }
    let(:profile) { create(:reviewer_profile, user: user) }
    let(:company) { create(:company, name: 'Solar Empresa', slug: 'solar-empresa') }

    before do
      allow(Rails.cache).to receive(:fetch).and_yield
    end

    it 'serializa avaliação pública com autor, empresa e conteúdo completo' do
      review = create(
        :review,
        user: user,
        company: company,
        status: :approved,
        headline: 'Excelente serviço',
        comment: 'Equipe atenciosa e instalação organizada.',
        pros: ['Atendimento rápido'],
        cons: ['Prazo poderia ser menor'],
        buyer_tip: 'Compare o escopo antes de contratar',
        verified: true,
        project_type: :residential,
        installation_status: :completed,
        estimated_power: 5.5,
        metadata: { 'would_recommend' => true }
      )

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
        pros: ['Atendimento rápido'],
        cons: ['Prazo poderia ser menor'],
        buyer_tip: 'Compare o escopo antes de contratar',
        would_recommend: true,
        user: include(name: 'Felipe Henrique'),
        company: include(id: company.id, name: 'Solar Empresa', slug: 'solar-empresa')
      )
    end

    it 'não expõe avaliações pendentes' do
      create(:review, user: user, company: company, status: :pending)

      expect(described_class.new(profile).call[:recent_reviews]).to be_empty
    end
  end
end
