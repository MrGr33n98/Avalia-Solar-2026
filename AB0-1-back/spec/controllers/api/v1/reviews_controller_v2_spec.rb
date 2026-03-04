# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::ReviewsController, type: :controller do
  let(:user) { create(:user) }
  let(:company) { create(:company) }
  let(:criterion) { create(:rating_criterion, weight: 1.0) }

  before do
    sign_in user
  end

  describe 'POST #create' do
    context 'with editorial payload' do
      let(:valid_params) do
        {
          review: {
            rating: 5,
            comment: 'Texto longo de teste com mais de dez caracteres',
            company_id: company.id,
            headline: 'Melhor Instalação Solar',
            project_type: 'residential',
            installation_status: 'completed',
            estimated_power: 5.5,
            content_metadata: {
              pros: ['Atendimento', 'Preço'],
              cons: ['Prazo'],
              buyer_tip: 'Peça o inversor X'
            },
            review_criterion_scores_attributes: [
              { rating_criterion_id: criterion.id, score: 4 }
            ]
          }
        }
      end

      it 'creates a new review and calculates weighted score' do
        expect {
          post :create, params: valid_params, format: :json
        }.to change(Review, :count).by(1)

        review = Review.last
        expect(review.headline).to eq('Melhor Instalação Solar')
        expect(review.pros).to include('Atendimento')
        # Score calculation: (5 * 0.4) + (4 * 0.5) + (completeness_bonus 0.1 * 4 * 2.5 / 10 * 5 = 0.5)
        # Expected: 2.0 + 2.0 + 0.5 = 4.5
        expect(review.rating.to_f).to eq(4.5)
      end
    end

    context 'with legacy payload' do
      let(:legacy_params) do
        {
          review: {
            rating: 4,
            comment: 'Apenas um comentário legado',
            company_id: company.id
          }
        }
      end

      it 'creates a review with manual rating fallback' do
        post :create, params: legacy_params, format: :json
        expect(response).to have_http_status(:created)
        
        review = Review.last
        expect(review.rating.to_f).to eq(4.0)
        expect(review.headline).to be_nil
      end
    end
  end

  describe 'Serialization' do
    it 'returns display_headline fallback for legacy reviews' do
      review = create(:review, comment: 'Texto original do comentário', headline: nil)
      serializer = ReviewSerializer.new(review)
      
      expect(serializer.display_headline).to eq('Texto original do comentário')
    end

    it 'returns pros and cons from content_metadata' do
      review = create(:review, content_metadata: { pros: ['Rapidez'], cons: [] })
      serializer = ReviewSerializer.new(review)
      
      expect(serializer.pros).to eq(['Rapidez'])
      expect(serializer.cons).to eq([])
    end
  end
end
