# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Marketplace proposals API', type: :request do
  let(:company) { create(:company, status: 'active', p2p_chat_enabled: true) }
  let(:other_company) { create(:company, status: 'active') }
  let(:buyer) do
    create(:user, role: 'review', company: nil, status: :active, confirmed_at: Time.current,
                  city: 'São Paulo', state: 'SP')
  end
  let(:company_user) do
    create(:user, role: 'company', company: nil, status: :active, confirmed_at: Time.current)
  end

  before do
    create(:company_member, company: company, user: company_user, role: 'owner', status: 'active')
  end

  def headers_for(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  def auth_headers_for(user)
    headers_for(user).except('Content-Type')
  end

  def pdf_upload
    file = Tempfile.new(['proposta', '.pdf'])
    file.binmode
    file.write("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n")
    file.rewind
    Rack::Test::UploadedFile.new(file.path, 'application/pdf', true)
  end

  def add_published_version(proposal, name: 'Sistema fotovoltaico', total_cents: 26_900_00)
    version = proposal.versions.create!(
      number: 1,
      title: 'Proposta completa',
      summary: 'Solução dimensionada para o projeto.',
      status: 'published',
      total_cents: total_cents,
      published_at: Time.current
    )
    version.items.create!(
      kind: 'equipment',
      name: name,
      quantity: 1,
      unit: 'un',
      unit_price_cents: total_cents,
      total_cents: total_cents,
      position: 0
    )
    proposal.update!(current_version_number: 1, total_cents: total_cents, published_at: Time.current)
    proposal
  end

  describe 'buyer journey' do
    let!(:lead) { create(:lead, company: nil, email: buyer.email, name: buyer.name) }
    let!(:distribution) do
      created = create(:lead_distribution, lead: lead, company: company, status: 'sent')
      created.accept!
      created
    end
    let!(:proposal) do
      add_published_version(
        create(:marketplace_proposal, lead: lead, company: company, lead_distribution: distribution, buyer_user: buyer,
                                      status: 'sent')
      )
    end

    it 'lista propostas publicadas e em preparação e aceita a versão escolhida' do
      draft_distribution = create(:lead_distribution, lead: lead, company: other_company, status: 'sent')
      draft_distribution.accept!
      draft = create(:marketplace_proposal, lead: lead, company: other_company, lead_distribution: draft_distribution,
                                            buyer_user: buyer, status: 'draft')

      get '/api/v1/proposals', headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['proposals'].map { |item| item['id'] }).to include(proposal.id)
      expect(body['proposals'].map { |item| item['id'] }).to include(draft.id)
      draft_payload = body['proposals'].find { |item| item['id'] == draft.id }
      expect(draft_payload).to include('status' => 'draft', 'revision_pending' => false, 'version' => nil)

      post "/api/v1/proposals/#{proposal.id}/accept",
           params: { version_id: proposal.current_version.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(proposal.reload.status).to eq('accepted')
      expect(proposal.project).to be_present
      expect(proposal.project.milestones.count).to eq(6)
    end

    it 'não permite escolher uma proposta ainda em preparação' do
      draft_distribution = create(:lead_distribution, lead: lead, company: other_company, status: 'sent')
      draft = Marketplace::ProposalBootstrapService.new(distribution: draft_distribution).call

      post "/api/v1/proposals/#{draft.id}/accept",
           params: { version_id: draft.current_version.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(draft.reload.status).to eq('draft')
    end

    it 'registra visualização, comparação e solicitação de reunião' do
      post "/api/v1/proposals/#{proposal.id}/view", headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(proposal.reload.status).to eq('viewed')

      get '/api/v1/proposals/compare', params: { ids: proposal.id }, headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['proposals'].map { |item| item['id'] }).to include(proposal.id)

      post "/api/v1/proposals/#{proposal.id}/meetings",
           params: { meeting_type: 'video', scheduled_at: 2.days.from_now.iso8601,
                     notes: 'Revisar equipamentos' }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:created)
      expect(proposal.reload.status).to eq('meeting_scheduled')
      expect(proposal.meetings.last.status).to eq('requested')
    end

    it 'registra pedido de alteração e recusa com decisão auditável' do
      post "/api/v1/proposals/#{proposal.id}/request_change",
           params: { reason: 'Ajustar prazo de instalação' }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(proposal.reload.status).to eq('negotiating')
      expect(proposal.decisions.last.kind).to eq('request_change')

      declined = add_published_version(
        create(:marketplace_proposal, lead: lead, company: other_company, buyer_user: buyer, status: 'sent'),
        total_cents: 27_500_00
      )
      post "/api/v1/proposals/#{declined.id}/decline",
           params: { reason: 'Condições fora do orçamento' }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(declined.reload.status).to eq('declined')
      expect(declined.decisions.last.reason).to eq('Condições fora do orçamento')
    end

    it 'mantém o contexto da proposta ao abrir a conversa' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: proposal.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      conversation = Conversation.find(JSON.parse(response.body)['id'])
      expect(conversation.marketplace_proposal_id).to eq(proposal.id)
    end

    it 'permite abrir conversa mesmo quando a proposta está em preparação (draft)' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      draft_distribution = create(:lead_distribution, lead: lead, company: company, status: 'sent')
      draft_proposal = create(
        :marketplace_proposal,
        lead: lead,
        company: company,
        lead_distribution: draft_distribution,
        buyer_user: buyer,
        status: 'draft'
      )

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: draft_proposal.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      conversation = Conversation.find(JSON.parse(response.body)['id'])
      expect(conversation.marketplace_proposal_id).to eq(draft_proposal.id)
    end

    it 'rejeita proposta com 403 se o usuário não for o comprador nem admin' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      other_buyer = create(:user, role: 'review', company: nil, status: :active, confirmed_at: Time.current)

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: proposal.id }.to_json,
           headers: headers_for(other_buyer)

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['code']).to eq('PROPOSAL_ACCESS_DENIED')
      expect(body['message']).to eq('Você não tem acesso a esta proposta.')
    end

    it 'sincroniza buyer_user_id quando a proposta é vinculada pelo email do lead' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      unlinked_distribution = create(:lead_distribution, lead: lead, company: company, status: 'sent')
      unlinked_proposal = create(
        :marketplace_proposal,
        lead: lead,
        company: company,
        lead_distribution: unlinked_distribution,
        buyer_user: nil,
        status: 'draft'
      )

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: unlinked_proposal.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(unlinked_proposal.reload.buyer_user_id).to eq(buyer.id)
    end

    it 'não sobrescreve buyer_user_id existente com novo usuário' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      original_buyer = create(:user, role: 'review', company: nil, status: :active, confirmed_at: Time.current)
      assigned_distribution = create(:lead_distribution, lead: lead, company: company, status: 'sent')
      assigned_proposal = create(
        :marketplace_proposal,
        lead: lead,
        company: company,
        lead_distribution: assigned_distribution,
        buyer_user: original_buyer,
        status: 'draft'
      )

      other_buyer = create(:user, role: 'review', company: nil, status: :active, confirmed_at: Time.current)

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: assigned_proposal.id }.to_json,
           headers: headers_for(other_buyer)

      expect(response).to have_http_status(:forbidden)
      expect(assigned_proposal.reload.buyer_user_id).to eq(original_buyer.id)
    end

    it 'preserva o marketplace_proposal_id original da conversa quando outra proposta é acessada' do
      allow_any_instance_of(Company).to receive(:feature_access).and_wrap_original do |method|
        method.call.merge('p2p_chat' => { 'state' => 'enabled' })
      end

      # Cria conversa inicial com proposal 1
      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: proposal.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      conversation = Conversation.find(JSON.parse(response.body)['id'])
      expect(conversation.marketplace_proposal_id).to eq(proposal.id)

      # Segunda proposta para o mesmo comprador e empresa
      second_distribution = create(:lead_distribution, lead: lead, company: company, status: 'sent')
      second_proposal = create(
        :marketplace_proposal,
        lead: lead,
        company: company,
        lead_distribution: second_distribution,
        buyer_user: buyer,
        status: 'draft'
      )

      post '/api/v1/conversations',
           params: { company_id: company.id, marketplace_proposal_id: second_proposal.id }.to_json,
           headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(conversation.reload.marketplace_proposal_id).to eq(proposal.id)
    end
  end

  describe 'company workspace' do
    let!(:lead) { create(:lead, company: nil) }
    let!(:distribution) { create(:lead_distribution, lead: lead, company: company, status: 'sent') }

    it 'cria, publica e lista a proposta no tenant da empresa' do
      prepared = Marketplace::ProposalBootstrapService.new(distribution: distribution).call

      expect do
        post '/api/v1/company_dashboard/proposals',
             params: { company_id: company.id, lead_distribution_id: distribution.id }.to_json,
             headers: headers_for(company_user)
      end.not_to change(MarketplaceProposal, :count)

      expect(response).to have_http_status(:created)
      proposal_id = JSON.parse(response.body).dig('proposal', 'id')
      expect(proposal_id).to eq(prepared.id)

      patch "/api/v1/company_dashboard/proposals/#{proposal_id}",
            params: { company_id: company.id, proposal: {
              title: 'Proposta comercial',
              summary: 'Condições comerciais e técnicas.',
              valid_until: 30.days.from_now.to_date,
              items: [{ kind: 'service', name: 'Instalação solar', quantity: 1, unit: 'un',
                        unit_price_cents: 28_500_00, position: 0 }],
              terms: [{ key: 'warranty', label: 'Garantia', value: '12 anos', position: 0 }]
            } }.to_json,
            headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)

      post "/api/v1/company_dashboard/proposals/#{proposal_id}/send",
           params: { company_id: company.id }.to_json,
           headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)
      expect(MarketplaceProposal.find(proposal_id).status).to eq('sent')
      expect(lead.reload.wizard_status).to eq('proposal_sent')
    end

    it 'propaga uma resposta real da empresa até a lista do comprador' do
      lead.update!(email: buyer.email, name: buyer.name)
      prepared = Marketplace::ProposalBootstrapService.new(distribution: distribution).call

      patch "/api/v1/company_dashboard/proposals/#{prepared.id}",
            params: { company_id: company.id, proposal: {
              title: 'Proposta solar publicada',
              summary: 'Sistema dimensionado para o consumo informado.',
              valid_until: 30.days.from_now.to_date,
              items: [{ kind: 'equipment', name: 'Kit fotovoltaico', quantity: 1, unit: 'un',
                        unit_price_cents: 26_900_00, position: 0 }],
              terms: [{ key: 'warranty', label: 'Garantia', value: '12 anos', position: 0 }]
            } }.to_json,
            headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)

      post "/api/v1/company_dashboard/proposals/#{prepared.id}/send",
           params: { company_id: company.id }.to_json,
           headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)

      get '/api/v1/proposals', headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)['proposals'].find { |item| item['id'] == prepared.id }
      expect(payload).to include('status' => 'sent')
      expect(payload.dig('version', 'title')).to eq('Proposta solar publicada')
      expect(payload.dig('company', 'id')).to eq(company.id)
    end

    it 'cria uma nova versão preservando o histórico da proposta' do
      proposal = add_published_version(
        create(:marketplace_proposal, lead: lead, company: company, lead_distribution: distribution, status: 'draft'),
        total_cents: 28_500_00
      )

      post "/api/v1/company_dashboard/proposals/#{proposal.id}/new_version",
           params: { company_id: company.id }.to_json,
           headers: headers_for(company_user)

      expect(response).to have_http_status(:created)
      expect(proposal.reload.status).to eq('draft')
      expect(proposal.versions.order(:number).pluck(:number)).to eq([1, 2])
      expect(JSON.parse(response.body).dig('proposal', 'versions').length).to eq(2)
    end

    it 'atualiza reunião, projeto e milestone no tenant da empresa' do
      proposal = add_published_version(
        create(:marketplace_proposal, lead: lead, company: company, lead_distribution: distribution,
                                      status: 'accepted'),
        total_cents: 28_500_00
      )
      meeting = proposal.meetings.create!(
        buyer_user: company_user,
        company: company,
        meeting_type: 'video',
        status: 'requested'
      )

      patch "/api/v1/company_dashboard/proposals/#{proposal.id}/meetings/#{meeting.id}",
            params: { company_id: company.id, status: 'confirmed' }.to_json,
            headers: headers_for(company_user)

      expect(response).to have_http_status(:ok)
      expect(meeting.reload.status).to eq('confirmed')

      patch "/api/v1/company_dashboard/proposals/#{proposal.id}/project",
            params: { company_id: company.id, status: 'in_progress' }.to_json,
            headers: headers_for(company_user)

      expect(response).to have_http_status(:ok)
      project = proposal.reload.project
      expect(project.status).to eq('in_progress')

      milestone = project.milestones.create!(
        key: 'site_visit',
        title: 'Visita técnica',
        position: 0,
        status: 'pending'
      )
      patch "/api/v1/company_dashboard/proposals/#{proposal.id}/project/milestones/#{milestone.id}",
            params: { company_id: company.id, status: 'current', notes: 'Agendada com o cliente' }.to_json,
            headers: headers_for(company_user)

      expect(response).to have_http_status(:ok)
      expect(milestone.reload.status).to eq('current')
      expect(milestone.notes).to eq('Agendada com o cliente')
    end

    it 'impede que uma empresa consulte outro tenant' do
      get '/api/v1/company_dashboard/proposals',
          params: { company_id: other_company.id },
          headers: headers_for(company_user)

      expect(response).to have_http_status(:forbidden)
    end

    it 'anexa, publica e entrega um PDF privado somente ao comprador autorizado' do
      lead.update!(email: buyer.email, name: buyer.name)
      proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution).call

      patch "/api/v1/company_dashboard/proposals/#{proposal.id}",
            params: { company_id: company.id, proposal: {
              title: 'Proposta documental', valid_until: 30.days.from_now.to_date, total_cents: 25_750_00
            } }.to_json,
            headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)

      upload = pdf_upload
      post "/api/v1/company_dashboard/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents",
           params: { company_id: company.id, file: upload }, headers: auth_headers_for(company_user)

      expect(response).to have_http_status(:created)
      document_id = JSON.parse(response.body).dig('proposal', 'version', 'documents', 0, 'id')
      expect(document_id).to be_present

      post "/api/v1/company_dashboard/proposals/#{proposal.id}/send",
           params: { company_id: company.id }.to_json, headers: headers_for(company_user)
      expect(response).to have_http_status(:ok)

      get "/api/v1/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents/#{document_id}/download",
          headers: headers_for(buyer)

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq('application/pdf')
      expect(response.headers['Cache-Control']).to include('private', 'no-store')

      intruder = create(:user, role: 'review', company: nil, status: :active, confirmed_at: Time.current)
      get "/api/v1/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents/#{document_id}/download",
          headers: headers_for(intruder)
      expect(response).to have_http_status(:forbidden)
    ensure
      upload&.tempfile&.close
    end

    it 'rejeita conteúdo disfarçado e impede remoção após publicação' do
      proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution).call
      fake = Tempfile.new(['proposta', '.pdf'])
      fake.write('arquivo executável disfarçado')
      fake.rewind
      fake_upload = Rack::Test::UploadedFile.new(fake.path, 'application/pdf', true)

      post "/api/v1/company_dashboard/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents",
           params: { company_id: company.id, file: fake_upload }, headers: auth_headers_for(company_user)
      expect(response).to have_http_status(:unprocessable_entity)

      upload = pdf_upload
      post "/api/v1/company_dashboard/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents",
           params: { company_id: company.id, file: upload }, headers: auth_headers_for(company_user)
      document_id = JSON.parse(response.body).dig('proposal', 'version', 'documents', 0, 'id')

      patch "/api/v1/company_dashboard/proposals/#{proposal.id}",
            params: { company_id: company.id, proposal: {
              title: 'Proposta documental', valid_until: 30.days.from_now.to_date, total_cents: 25_750_00
            } }.to_json,
            headers: headers_for(company_user)
      post "/api/v1/company_dashboard/proposals/#{proposal.id}/send",
           params: { company_id: company.id }.to_json, headers: headers_for(company_user)

      delete "/api/v1/company_dashboard/proposals/#{proposal.id}/versions/#{proposal.current_version.id}/documents/#{document_id}",
             params: { company_id: company.id }.to_json, headers: headers_for(company_user)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(proposal.current_version.reload.documents.attachments.find_by(id: document_id)).to be_present
    ensure
      fake&.close!
      upload&.tempfile&.close
    end
  end
end
