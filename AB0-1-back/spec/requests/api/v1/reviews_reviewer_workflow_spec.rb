require 'rails_helper'

RSpec.describe 'Fluxo do avaliador em /api/v1/reviews', type: :request do
  let(:user) { create(:user) }
  let(:company) { create(:company) }

  before do
    allow_any_instance_of(Api::V1::BaseController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::BaseController).to receive(:current_user).and_return(user)
  end

  describe 'GET /api/v1/reviews/mine' do
    it 'expõe o motivo privado da moderação somente ao autor' do
      review = create(:review, user: user, company: company, status: :rejected,
                                moderation_notes: 'Detalhe melhor o serviço prestado.')

      get '/api/v1/reviews/mine'
      expect(response).to have_http_status(:ok)
      item = JSON.parse(response.body).fetch('data').find { |row| row['id'] == review.id }
      expect(item['moderation_notes']).to eq('Detalhe melhor o serviço prestado.')
    end
  end

  describe 'PUT /api/v1/reviews/:id' do
    it 'permite corrigir a rejeitada, retorna à fila e registra auditoria' do
      review = create(:review, user: user, company: company, status: :rejected,
                                comment: 'Experiência anterior.',
                                moderation_notes: 'Descreva os fatos.')

      expect do
        put "/api/v1/reviews/#{review.id}",
            params: { review: { comment: 'Atendimento realizado em três visitas.', rating: 4,
                                status: 'approved', company_id: 999_999 } }, as: :json
      end.to change(ReviewAuditEvent, :count).by(1)

      expect(response).to have_http_status(:ok)
      review.reload
      expect(review.status).to eq('pending')
      expect(review.company_id).to eq(company.id)
      expect(review.comment).to eq('Atendimento realizado em três visitas.')
      expect(review.moderation_notes).to be_nil
      expect(review.review_audit_events.last.event_type).to eq('review_resubmitted')
    end

    it 'bloqueia alterações diretas em conteúdo já publicado' do
      review = create(:review, user: user, company: company, status: :approved,
                                comment: 'Experiência publicada.')
      put "/api/v1/reviews/#{review.id}", params: { review: { comment: 'Outro conteúdo.' } }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(review.reload.comment).to eq('Experiência publicada.')
      expect(review.status).to eq('approved')
    end

    it 'impede um usuário de alterar a avaliação de outra pessoa' do
      review = create(:review, user: create(:user), company: company, status: :rejected)
      put "/api/v1/reviews/#{review.id}", params: { review: { comment: 'Texto indevido.' } }, as: :json

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET /api/v1/reviews/:id' do
    it 'impede a leitura pública de avaliações não publicadas de outros autores' do
      review = create(:review, user: create(:user), company: company, status: :rejected)
      get "/api/v1/reviews/#{review.id}"
      expect(response).to have_http_status(:not_found)
    end
  end
end
