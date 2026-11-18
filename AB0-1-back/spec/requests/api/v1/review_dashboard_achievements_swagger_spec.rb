# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/review_dashboard/achievements', type: :request do
  path '/api/v1/review_dashboard/achievements' do
    get 'Lista conquistas e progresso do avaliador' do
      tags 'Gamificação'
      produces 'application/json'
      parameter name: :Authorization, in: :header, type: :string, description: 'Bearer JWT token'

      let(:reviewer) { create(:user, role: 'review') }
      let!(:badge) do
        create(:achievement_badge,
               slug: 'review_approved_1',
               name: '1ª Avaliação Aprovada',
               category: 'review',
               tier: 'bronze',
               threshold: 1,
               points_xp: 50,
               action_enum: 'write_review',
               position: 1,
               active: true)
      end
      let(:auth_token) do
        JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
      end
      let(:Authorization) { "Bearer #{auth_token}" }

      response '200', 'Conquistas carregadas com sucesso' do
        schema type: :object,
               required: %w[schema_version summary achievements faq],
               properties: {
                 schema_version: { type: :string, example: '2026-11-v1' },
                 summary: {
                   type: :object,
                   required: %w[unlocked_count total_count xp_total completion_percentage],
                   properties: {
                     unlocked_count: { type: :integer },
                     total_count: { type: :integer },
                     xp_total: { type: :integer },
                     completion_percentage: { type: :integer },
                     next_suggested: { type: :object, nullable: true }
                   }
                 },
                 achievements: {
                   type: :array,
                   items: {
                     type: :object,
                     required: %w[id name category state progress threshold asset action],
                     properties: {
                       id: { type: :string },
                       name: { type: :string },
                       title: { type: :string },
                       description: { type: :string },
                       category: { type: :string },
                       tier: { type: :string },
                       state: { type: :string, enum: %w[locked in_progress unlocked revoked] },
                       unlocked: { type: :boolean },
                       progress: { type: :integer },
                       threshold: { type: :integer },
                       points: { type: :integer },
                       xp: { type: :integer },
                       unlocked_at: { type: :string, nullable: true },
                       asset: {
                         type: :object,
                         properties: {
                           earned: { type: :string },
                           locked: { type: :string }
                         }
                       },
                       action: { type: :string },
                       share: {
                         type: :object,
                         nullable: true,
                         properties: {
                           verify_url: { type: :string },
                           token: { type: :string }
                         }
                       }
                     }
                   }
                 },
                 faq: {
                   type: :array,
                   items: {
                     type: :object,
                     properties: {
                       question: { type: :string },
                       answer: { type: :string }
                     }
                   }
                 }
               }

        run_test!
      end

      response '401', 'Não autenticado' do
        let(:Authorization) { nil }
        run_test!
      end

      response '403', 'Acesso negado para papel diferente de review' do
        let(:company_user) { create(:user, role: 'company') }
        let(:company_token) do
          JWT.encode({ user_id: company_user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
        end
        let(:Authorization) { "Bearer #{company_token}" }
        run_test!
      end
    end
  end
end
