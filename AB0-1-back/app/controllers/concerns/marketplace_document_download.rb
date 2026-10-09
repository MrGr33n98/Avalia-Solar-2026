# frozen_string_literal: true

module MarketplaceDocumentDownload
  extend ActiveSupport::Concern

  def download_document
    authorize @proposal, :show?
    versions = @proposal.versions
    versions = versions.where(status: 'published') unless is_a?(Api::V1::CompanyAdmin::ProposalsController)
    version = versions.find(params[:version_id])
    document = version.documents.attachments.find(params[:document_id])
    response.headers['Cache-Control'] = 'private, no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "sandbox; default-src 'none'"
    disposition = params[:preview] == '1' ? 'inline' : 'attachment'
    send_data document.download, filename: document.filename.to_s, type: 'application/pdf', disposition: disposition
  rescue ActiveRecord::RecordNotFound, ActiveStorage::FileNotFoundError
    render json: { error: 'Documento não encontrado' }, status: :not_found
  end
end
