# frozen_string_literal: true

class ReviewUploadMediaService
  ALLOWED_CONTENT_TYPES = ReviewMedia::ALLOWED_CONTENT_TYPES
  MAX_FILE_SIZE = ReviewMedia::MAX_FILE_SIZE

  class UploadError < StandardError; end

  def initialize(session:, user:, upload:, sort_order: 0)
    @session = session
    @user = user
    @upload = upload
    @sort_order = sort_order.to_i
  end

  def call
    validate_session!
    raise UploadError, 'Arquivo obrigatório.' if @upload.blank?
    raise UploadError, 'Você pode adicionar até 6 fotos.' if media_count_limit_reached?

    info = file_info
    validate_file!(info)
    validate_total_size!(info[:byte_size])

    media = @session.review_media.build(
      user: @user,
      media_type: 'image',
      status: :processing,
      moderation_status: :pending,
      sort_order: @sort_order,
      content_type: info[:content_type],
      byte_size: info[:byte_size],
      metadata: { detected_content_type: info[:content_type] }
    )
    media.file.attach(io: info[:io], filename: info[:filename], content_type: info[:content_type])
    media.save!
    ProcessReviewMediaJob.perform_later(media.id)
    media
  rescue ActiveRecord::RecordInvalid => e
    raise UploadError, e.record.errors.full_messages.to_sentence
  end

  private

  def validate_session!
    return if @session.user_id == @user.id && @session.available?

    raise UploadError, 'Sessão de upload inválida ou expirada.'
  end

  def media_count_limit_reached?
    @session.review_media.where.not(status: :failed).count >= ReviewMedia::MAX_PER_REVIEW
  end

  def file_info
    raise UploadError, 'Upload deve ser enviado como arquivo.' unless @upload.respond_to?(:tempfile)

    tempfile = @upload.tempfile
    tempfile.rewind
    content_type = Marcel::MimeType.for(tempfile, name: @upload.original_filename.to_s)
    magic_bytes = tempfile.read(12)
    tempfile.rewind

    {
      io: tempfile,
      filename: @upload.original_filename.to_s,
      byte_size: tempfile.size,
      content_type: content_type,
      magic_bytes: magic_bytes
    }
  end

  def validate_file!(info)
    valid_magic = case info[:content_type]
                  when 'image/jpeg' then info[:magic_bytes].start_with?("\xFF\xD8\xFF".b)
                  when 'image/png' then info[:magic_bytes].start_with?("\x89PNG\r\n\x1A\n".b)
                  when 'image/webp' then info[:magic_bytes].start_with?('RIFF'.b) && info[:magic_bytes][8, 4] == 'WEBP'.b
                  else false
                  end

    return if ALLOWED_CONTENT_TYPES.include?(info[:content_type]) && valid_magic && info[:byte_size] <= MAX_FILE_SIZE

    raise UploadError, 'Formato não suportado. Use JPG, PNG ou WebP, com até 5 MB.'
  end

  def validate_total_size!(byte_size)
    total = @session.review_media.sum(:byte_size).to_i + byte_size
    return if total <= ReviewMedia::MAX_TOTAL_SIZE

    raise UploadError, 'O tamanho total das fotos não pode ultrapassar 25 MB.'
  end
end