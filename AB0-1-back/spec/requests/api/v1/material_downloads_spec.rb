# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MaterialDownloads API', type: :request do
  let(:company) { create(:company, status: :active) }
  let(:material) { create(:company_material, company: company, status: 'draft', slug: 'catalogo-premium', gate_mode: 'none') }

  before do
    allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(true)
  end

  def attach_ready_pdf!(mat = material)
    asset = build(:digital_asset,
                  attachable: mat,
                  company: mat.company,
                  kind: 'document',
                  status: 'pending',
                  processing_status: 'ready',
                  external_url: nil)
    asset.file.attach(
      io: StringIO.new('%PDF-1.4 test'),
      filename: 'catalogo.pdf',
      content_type: 'application/pdf'
    )
    asset.save!
    asset
  end

  describe 'POST /api/v1/material_downloads' do
    context 'quando o material é público e está publicado' do
      before do
        attach_ready_pdf!
        material.publish!
      end

      it 'cria o download com sucesso' do
        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: material.slug
        }

        expect(response).to have_http_status(:created)
        body = JSON.parse(response.body)
        expect(body).to have_key('download_id')
        expect(body).to have_key('delivery_url')
        expect(body).to have_key('expires_at')

        download = MaterialDownload.find(body['download_id'])
        expect(download.company_material).to eq(material)
        expect(download.content_lead).to be_nil
      end

      it 'reutiliza o download com a mesma Idempotency-Key' do
        headers = { 'Idempotency-Key' => 'unique-key-123' }

        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: material.slug
        }, headers: headers
        expect(response).to have_http_status(:created)
        id1 = JSON.parse(response.body)['download_id']

        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: material.slug
        }, headers: headers
        expect(response).to have_http_status(:created)
        id2 = JSON.parse(response.body)['download_id']

        expect(id1).to eq(id2)
      end
    end

    context 'quando o material é gated' do
      let(:form) { create(:content_lead_form, company: company, status: 'active') }
      let(:gated_material) { create(:company_material, company: company, status: 'draft', gate_mode: 'form', content_lead_form: form) }

      before do
        attach_ready_pdf!(gated_material)
        gated_material.publish!
      end

      it 'cria o lead e o download se dados estiverem completos' do
        expect {
          post '/api/v1/material_downloads', params: {
            company_id: company.id,
            material_slug: gated_material.slug,
            email: 'lead@example.com',
            name: 'Lead Teste',
            marketing_consent: '1'
          }
        }.to change(ContentLead, :count).by(1).and change(MaterialDownload, :count).by(1)

        expect(response).to have_http_status(:created)
        download = MaterialDownload.last
        expect(download.content_lead.email).to eq('lead@example.com')
        expect(download.content_lead.name).to eq('Lead Teste')
      end

      it 'retorna erro se o formulário não estiver ativo ou for nulo' do
        form.update!(status: 'inactive')

        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: gated_material.slug,
          email: 'lead@example.com',
          name: 'Lead Teste'
        }

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['error']).to include('Formulário de captura não está ativo')
      end

      it 'retorna erro se falta e-mail' do
        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: gated_material.slug,
          name: 'Sem Email'
        }

        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'quando o material não está publicado ou não existe' do
      it 'retorna 404 se rascunho' do
        attach_ready_pdf! # deixa publishable, mas continua draft

        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: material.slug
        }

        expect(response).to have_http_status(:not_found)
      end

      it 'retorna 404 se empresa não existe' do
        post '/api/v1/material_downloads', params: {
          company_id: 999999,
          material_slug: 'inexistente'
        }

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'quando a funcionalidade está desabilitada' do
      before do
        attach_ready_pdf!
        material.publish!
      end

      it 'retorna 403 Forbidden' do
        allow_any_instance_of(Company).to receive(:feature_enabled?).with('downloadable_materials').and_return(false)

        post '/api/v1/material_downloads', params: {
          company_id: company.id,
          material_slug: material.slug
        }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'GET /api/v1/material_downloads/:id/file' do
    let(:token) { 'super-secret-token' }
    let(:download) do
      MaterialDownload.create!(
        company: company,
        company_material: material,
        authorization_token_digest: Digest::SHA256.hexdigest(token),
        authorized_at: Time.current,
        expires_at: 15.minutes.from_now,
        delivery_status: 'authorized'
      )
    end

    context 'quando o download e token são válidos' do
      before do
        attach_ready_pdf!
        material.publish!
      end

      it 'redireciona para o arquivo e atualiza status e download_count' do
        expect(material.download_count).to eq(0)

        get "/api/v1/material_downloads/#{download.id}/file", params: { token: token }

        expect(response).to have_http_status(:redirect)
        expect(response.location).to include('catalogo.pdf')

        download.reload
        expect(download.delivery_status).to eq('delivered')
        expect(download.delivered_at).to be_present
        expect(material.reload.download_count).to eq(1)
      end

      it 'não incrementa download_count em downloads subsequentes' do
        download.update!(delivery_status: 'delivered', delivered_at: 5.minutes.ago)
        material.update!(download_count: 5)

        get "/api/v1/material_downloads/#{download.id}/file", params: { token: token }

        expect(response).to have_http_status(:redirect)
        expect(material.reload.download_count).to eq(5)
      end
    end

    context 'quando o token é inválido ou expirado' do
      before do
        attach_ready_pdf!
        material.publish!
      end

      it 'retorna 403 para token incorreto' do
        get "/api/v1/material_downloads/#{download.id}/file", params: { token: 'token-errado' }

        expect(response).to have_http_status(:forbidden)
      end

      it 'retorna 403 para download expirado' do
        download.update!(expires_at: 1.minute.ago)

        get "/api/v1/material_downloads/#{download.id}/file", params: { token: token }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'quando o arquivo não está anexado' do
      before do
        # material publicado, mas sem o arquivo de fato anexado no active storage
        material.update_columns(status: 'published', published_at: Time.current)
        create(:digital_asset, attachable: material, company: company, kind: 'document', status: 'published', processing_status: 'ready')
      end

      it 'retorna 404' do
        get "/api/v1/material_downloads/#{download.id}/file", params: { token: token }

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
