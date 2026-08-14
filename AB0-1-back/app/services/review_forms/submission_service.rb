module ReviewForms
  class SubmissionService
    def initialize(review_form:, params:, source:, request_context:)
      @review_form, @params, @source, @request_context = review_form, params, source, request_context
    end
    def call
      category = @review_form.experience_category
      review = build_review(category)
      attach_scores(review, category)
      review.save!
      review
    end
    private
    def build_review(category)
      @review_form.reviews.new(company: @review_form.company, category: category, rating: @params[:rating], comment: @params[:comment], nps_score: @params[:nps_score], capture_flow_source: @source, is_legacy: category.nil?, form_answers: permitted_answers, verification_status: 'pending', metadata: metadata)
    end
    def metadata
      { reviewer_name: @params[:reviewer_name].to_s.strip, reviewer_contact: @params[:contact].to_s.strip, city: @params[:city].to_s.strip, state: @params[:state].to_s.strip.upcase.first(2), real_experience_confirmed: boolean(@params[:real_experience]), lgpd_consent: true, lgpd_consent_at: Time.current.iso8601, source_channel: @source, source_token: @review_form.token, landing_path: @request_context.path.to_s.first(500), referrer: @request_context.referrer.to_s.first(500), user_agent: @request_context.user_agent.to_s.first(500), ip_hash: @request_context.ip_hash, submitted_at: Time.current.iso8601 }
    end
    def attach_scores(review, category)
      scores = @params[:criterion_scores].is_a?(Hash) ? @params[:criterion_scores] : permitted_answers[:criterion_scores]
      scores = permitted_answers if scores.blank? && permitted_answers.is_a?(Hash)
      return unless scores.present?
      allowed = CriteriaResolver.call(review_form: @review_form, category: category)
      scores.each do |key, value|
        next if value.blank?
        criterion = allowed.find { |item| item.id == Integer(key, exception: false) || item.slug == key.to_s.parameterize }
        next unless criterion
        review.review_criterion_scores.build(rating_criterion: criterion, score: value.to_f, title_snapshot: criterion.title, weight_snapshot: criterion.weight)
      end
    end
    def permitted_answers
      answers = @params[:answers]
      answers.respond_to?(:permit!) ? answers.permit!.to_h : {}
    end
    def boolean(value)
      ActiveModel::Type::Boolean.new.cast(value)
    end
  end
end
