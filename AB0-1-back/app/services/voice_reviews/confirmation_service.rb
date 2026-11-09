module VoiceReviews
  class ConfirmationService
    class Error < StandardError; end

    def self.call(session:, token:, params:)
      new(session:, token:, params:).call
    end

    def self.confirm_from_whatsapp!(session:)
      transcript = session.latest_transcript
      raise Error, 'Transcrição indisponível' unless transcript

      token = session.issue_new_token!
      rating = session.draft_rating || transcript.inferred_rating || 5
      text = transcript.text.to_s.strip.truncate(500)
      reviewer_name = session.draft_payload.to_h['reviewer_name'].to_s.strip.presence
      criterion_scores = session.draft_payload.to_h['criterion_scores']
      new(
        session: session,
        token: token,
        params: {
          transcript_version: transcript.version,
          review_text: text.length >= 5 ? text : 'Experiência avaliada por áudio via WhatsApp.',
          headline: transcript.headline,
          rating: rating,
          reviewer_name: reviewer_name,
          criterion_scores: criterion_scores,
          experience_confirmed: true,
          publish_text_consent: true,
          display_name_mode: reviewer_name ? 'full_name' : 'anonymous',
          full_name_consent: reviewer_name.present?,
          confirmed_via: 'whatsapp_reply'
        },
        skip_token_check: true
      ).call
    end

    def initialize(session:, token:, params:, skip_token_check: false)
      @session = session
      @token = token.to_s
      @params = params
      @skip_token_check = skip_token_check
    end

    def call
      raise Error, 'Avaliações por voz indisponíveis' unless VoiceReviews::Config.enabled?

      session.with_lock do
        authenticate!
        return existing_result if session.submitted? && session.voice_review_publication.present?

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

    attr_reader :session, :token, :params, :skip_token_check

    def authenticate!
      raise Error, 'Sessão inválida ou expirada' unless session.active_now?
      return if skip_token_check

      raise Error, 'Sessão inválida ou expirada' unless session.token_matches?(token)
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
      review = session.company.reviews.new(
        review_form: session.review_form, category: category, rating: params[:rating].to_i,
        headline: (params[:headline].presence || transcript.headline).to_s.strip.truncate(120).presence,
        comment: params[:review_text].to_s.strip, is_legacy: category.blank?, status: 'pending',
        verification_status: 'pending', capture_flow_source: 'whatsapp_voice',
        metadata: build_metadata(transcript)
      )
      attach_criterion_scores(review, category, transcript)
      review.save!
      review
    end

    def build_metadata(transcript)
      reviewer_name = (params[:reviewer_name].presence || session.draft_payload.to_h['reviewer_name']).to_s.strip.presence
      {
        'voice_review_session_id' => session.id,
        'voice_review_transcript_id' => transcript.id,
        'reviewer_name' => reviewer_name,
        'collection_channel' => 'whatsapp_voice',
        'verified_by_voice' => true,
        'voice_badge_label' => 'Avaliação Verificada via Áudio (WhatsApp)',
        'confirmed_via' => params[:confirmed_via].presence || 'web_review_card',
        'mentioned_equipment' => Array(params[:mentioned_equipment].presence || transcript.mentioned_equipment),
        'inferred_criteria_snapshot' => resolve_criteria_snapshot(transcript),
        'display_name_mode' => params[:display_name_mode].to_s,
        'voice_publication_confirmed_at' => Time.current.iso8601,
        'lgpd_consent' => params[:display_name_mode].to_s == 'full_name'
      }.compact
    end

    def resolve_criteria_snapshot(transcript)
      override = params[:criterion_scores].presence || session.draft_payload.to_h['criterion_scores']
      criteria = transcript&.inferred_criteria.presence || []

      if criteria.any?
        criteria.map do |item|
          key = item['criterion_id']&.to_s || item['criterion_slug'].to_s
          score = override.is_a?(Hash) && (override[key].presence || override[item['criterion_slug']].presence) || item['score']
          item.merge('score' => score.to_i.between?(1, 5) ? score.to_i : item['score'])
        end
      elsif override.is_a?(Hash) && override.any?
        allowed = ReviewForms::CriteriaResolver.call(review_form: session.review_form)
        allowed = RatingCriterion.active.where(category_id: 70).to_a if allowed.empty?
        override.filter_map do |slug_or_id, score|
          next unless score.to_i.between?(1, 5)

          crit = allowed.find { |c| c.id.to_s == slug_or_id.to_s || c.slug == slug_or_id.to_s }
          {
            'criterion_id' => crit&.id,
            'criterion_slug' => crit&.slug || slug_or_id,
            'title' => crit&.title || slug_or_id.to_s.humanize,
            'score' => score.to_i
          }
        end
      else
        []
      end
    end

    def attach_criterion_scores(review, category, transcript)
      allowed = ReviewForms::CriteriaResolver.call(review_form: session.review_form, category: category)
      allowed = RatingCriterion.active.where(category_id: 70).to_a if allowed.empty?
      return if allowed.empty?

      resolve_criteria_snapshot(transcript).each do |item|
        score = item['score'].to_i
        next unless score.between?(1, 5)

        criterion = allowed.find { |c| c.id == item['criterion_id'].to_i || c.slug == item['criterion_slug'].to_s }
        next unless criterion

        review.review_criterion_scores.build(
          rating_criterion: criterion, score: score, title_snapshot: criterion.title, weight_snapshot: criterion.weight
        )
      end
    end

    def persist_consents!
      VoiceReviewConsent.create!(voice_review_session: session, purpose: 'publish_text', granted: true,
                                 policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current)
      return unless params[:display_name_mode].to_s == 'full_name'

      VoiceReviewConsent.create!(voice_review_session: session, purpose: 'display_full_name', granted: true,
                                 policy_version: VoiceReviews::Config.policy_version, granted_at: Time.current)
    end

    def existing_result
      review = session.published_review || session.voice_review_publication&.review
      return {} unless review

      { review_id: review.id, review_status: review.status, verification_status: review.verification_status,
        publication_id: session.voice_review_publication&.id }
    end

    def boolean(value)
      ActiveModel::Type::Boolean.new.cast(value)
    end
  end
end
