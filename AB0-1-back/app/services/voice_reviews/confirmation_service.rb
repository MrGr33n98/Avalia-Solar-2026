module VoiceReviews
  class ConfirmationService
    class Error < StandardError; end

    def self.call(session:, token:, params:)
      new(session:, token:, params:).call
    end

    def initialize(session:, token:, params:)
      @session = session
      @token = token.to_s
      @params = params
    end

    def call
      raise Error, 'Avaliações por voz indisponíveis' unless VoiceReviews::Config.enabled?

      session.with_lock do
        authenticate!
        return existing_result if session.voice_review_publication.present?

        transcript = session.latest_transcript
        validate!(transcript)
        review = build_review(transcript)
        persist_consents!
        publication = VoiceReviewPublication.create!(voice_review_session: session, review:, voice_review_transcript: transcript,
                                                     confirmed_text: review.comment, rating: review.rating,
                                                     name_mode: params[:display_name_mode], confirmed_at: Time.current)
        session.update!(state: 'submitted', confirmed_at: Time.current, published_review: review,
                        version: session.version + 1)
        VoiceReviews::EventRecorder.record!(event_name: 'voice_review_submitted', company: session.company, session:,
                                            dedupe_key: "review-submitted:#{review.id}")
        { review_id: review.id, review_status: review.status, verification_status: review.verification_status,
          publication_id: publication.id }
      end
    end

    private

    attr_reader :session, :token, :params

    def authenticate!
      raise Error, 'Sessão inválida ou expirada' unless session.active_now? && session.token_matches?(token)
    end

    def validate!(transcript)
      raise Error, 'Transcrição indisponível' unless transcript
      raise Error, 'Versão da transcrição desatualizada' unless transcript.version.to_i == params[:transcript_version].to_i
      raise Error, 'A experiência precisa ser confirmada' unless boolean(params[:experience_confirmed])
      raise Error, 'É necessário autorizar a publicação do texto' unless boolean(params[:publish_text_consent])
      raise Error, 'A nota deve estar entre 1 e 5' unless params[:rating].to_i.between?(1, 5)
      raise Error, 'O texto deve ter entre 5 e 500 caracteres' unless params[:review_text].to_s.strip.length.between?(5, 500)
      raise Error, 'Nome inválido' unless %w[anonymous initials full_name].include?(params[:display_name_mode].to_s)
      return unless params[:display_name_mode].to_s == 'full_name'

      raise Error, 'Consentimento de nome completo ausente' unless boolean(params[:full_name_consent])
    end

    def build_review(transcript)
      category = session.review_form.experience_category
      session.company.reviews.create!(review_form: session.review_form, category:, rating: params[:rating].to_i,
                                      comment: params[:review_text].to_s.strip, is_legacy: category.blank?, status: 'pending',
                                      verification_status: 'pending', capture_flow_source: 'whatsapp_voice',
                                      metadata: { 'voice_review_session_id' => session.id,
                                                  'voice_review_transcript_id' => transcript.id,
                                                  'collection_channel' => 'whatsapp_voice',
                                                  'display_name_mode' => params[:display_name_mode].to_s,
                                                  'voice_publication_confirmed_at' => Time.current.iso8601,
                                                  'lgpd_consent' => false })
    end

    def persist_consents!
      VoiceReviewConsent.create!(voice_review_session: session, purpose: 'publish_text', granted: true,
                                 policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current)
      return unless params[:display_name_mode].to_s == 'full_name'

      VoiceReviewConsent.create!(voice_review_session: session, purpose: 'display_full_name', granted: true,
                                 policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current)
    end

    def existing_result
      review = session.published_review
      { review_id: review.id, review_status: review.status, verification_status: review.verification_status,
        publication_id: session.voice_review_publication.id }
    end

    def boolean(value)
      ActiveModel::Type::Boolean.new.cast(value)
    end
  end
end
