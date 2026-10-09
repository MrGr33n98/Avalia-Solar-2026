# frozen_string_literal: true

require 'open3'
require 'timeout'

module Marketplace
  class ProposalDocumentService
    class InvalidDocument < StandardError; end
    class ScannerUnavailable < StandardError; end

    def self.max_bytes
      ENV.fetch('PROPOSAL_DOCUMENT_MAX_BYTES', 10.megabytes).to_i.clamp(1, 50.megabytes)
    end

    def self.metadata(version)
      version.documents.attachments.includes(:blob).map do |document|
        { id: document.id, filename: document.filename.to_s, byte_size: document.byte_size,
          content_type: document.content_type, created_at: document.created_at }
      end
    end

    def initialize(proposal:, version:, actor:)
      @proposal, @version, @actor = proposal, version, actor
    end

    def upload(file)
      validate_file!(file)
      blob = nil
      proposal.with_lock do
        ensure_editable!
        raise InvalidDocument, 'Limite de 10 documentos por versão' if version.documents.count >= 10

        blob = ActiveStorage::Blob.create_and_upload!(io: file.tempfile, filename: file.original_filename,
                                                     content_type: 'application/pdf', identify: false,
                                                     service_name: storage_service)
        version.documents.attach(blob)
        proposal.record_event('document.attached', actor: actor, metadata: { version_id: version.id, blob_id: blob.id })
      end
    rescue StandardError
      blob&.purge if blob && !ActiveStorage::Attachment.exists?(blob_id: blob.id)
      raise
    end

    def remove(document)
      blob = document.blob
      proposal.with_lock do
        ensure_editable!
        proposal.record_event('document.removed', actor: actor,
                                                 metadata: { version_id: version.id, document_id: document.id })
        # O blob pode ser compartilhado com uma versão anterior. Preservar a evidência publicada.
        document.destroy!
      end
      blob.purge_later unless blob.attachments.exists?
    end

    private

    attr_reader :proposal, :version, :actor

    def storage_service
      Rails.env.production? ? 'proposal_documents' : (Rails.env.test? ? 'test' : 'local')
    end

    def ensure_editable!
      version.reload
      return if proposal.status == 'draft' && version.status == 'draft' && proposal.current_version.id == version.id

      raise InvalidDocument, 'Documentos publicados são imutáveis. Crie uma nova versão.'
    end

    def validate_file!(file)
      unless file.respond_to?(:tempfile) && file.size.positive? && file.size <= self.class.max_bytes
        raise InvalidDocument, "Envie um PDF de até #{self.class.max_bytes / 1.megabyte} MB"
      end

      data = file.tempfile.read
      file.tempfile.rewind
      valid = File.extname(file.original_filename).casecmp?('.pdf') && data.start_with?('%PDF-') &&
              data.rstrip.end_with?('%%EOF') && Marcel::MimeType.for(file.tempfile) == 'application/pdf'
      file.tempfile.rewind
      raise InvalidDocument, 'O conteúdo do arquivo não é um PDF válido' unless valid
      # Bloqueia ações explícitas; a inspeção antimalware é obrigatória em produção.
      if data.match?(%r{/(JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b}n)
        raise InvalidDocument, 'PDF com scripts, ações automáticas ou arquivos embutidos não é permitido'
      end

      scan!(file.tempfile.path) if Rails.env.production?
    end

    def scan!(path)
      scanner = ENV.fetch('PROPOSAL_DOCUMENT_SCANNER_COMMAND', 'clamscan')
      status = Timeout.timeout(60) { Open3.capture3(scanner, '--no-summary', path).last }
      raise InvalidDocument, 'Arquivo recusado pela verificação de segurança' if status.exitstatus == 1
      raise ScannerUnavailable, 'Verificação de documentos indisponível. Tente novamente.' unless status.success?
    rescue Errno::ENOENT, Timeout::Error
      raise ScannerUnavailable, 'Verificação de documentos indisponível. Tente novamente.'
    end
  end
end
