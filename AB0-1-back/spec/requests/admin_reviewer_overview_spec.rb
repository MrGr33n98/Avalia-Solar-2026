# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin reviewer overview', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) { create(:admin_user) }
  let!(:reviewer) { create(:user, role: 'review', name: 'Reviewer Teste', city: 'Recife', state: 'PE') }

  before { sign_in admin_user }

  it 'exibe métricas e filas operacionais com dados reais' do
    review = create(:review, user: reviewer, status: :pending)
    solution = create(:reviewer_solution, user: reviewer, verified: false)
    publication = create(:reviewer_publication, user: reviewer, title: 'Publicação operacional')
    ReviewerPublicationComment.create!(
      reviewer_publication: publication,
      name: 'Leitor Teste',
      email: 'leitor@example.com',
      body: 'Comentário operacional',
      status: 'active'
    )
    ReviewerPublicationEvent.create!(reviewer_publication: publication, event_name: 'publication_view')

    get admin_reviewer_overview_path

    expect(response).to have_http_status(:success)
    expect(response.body).to include('Fila de moderação de avaliações', review.id.to_s)
    expect(response.body).to include('Soluções aguardando verificação', solution.name)
    expect(response.body).to include('Publicação operacional', 'Visualizações', 'Comentários ativos')
  end

  it 'exibe estados vazios sem inventar métricas' do
    get admin_reviewer_overview_path

    expect(response).to have_http_status(:success)
    expect(response.body).to include('Nenhuma avaliação aguardando moderação.')
    expect(response.body).to include('Nenhuma solução aguardando verificação.')
    expect(response.body).to include('Nenhuma publicação cadastrada.')
    expect(response.body).to include('0')
  end
end