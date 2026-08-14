module ReviewForms
  class MetricsService
    def self.call(review_form:, range: nil)
      scope = review_form.review_form_events
      scope = scope.where(created_at: range) if range
      views = scope.where(event_type: %w[form_viewed qr_scanned]).count
      starts = scope.where(event_type: 'review_started').count
      reviews = review_form.reviews
      reviews = reviews.where(created_at: range) if range
      submissions = reviews.count
      approved = reviews.where(status: :approved).count
      rejected = reviews.where(status: :rejected).count
      { views: views, starts: starts, submissions: submissions, approved: approved, rejected: rejected,
        start_rate: rate(starts, views), completion_rate: rate(submissions, starts),
        approval_rate: rate(approved, submissions), conversion_rate: rate(submissions, views) }
    end

    def self.rate(value, total)
      total.to_f.positive? ? ((value.to_f / total) * 100).round(1) : 0.0
    end
    private_class_method :rate
  end
end
