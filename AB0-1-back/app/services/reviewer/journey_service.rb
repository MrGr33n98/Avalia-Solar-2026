# frozen_string_literal: true

module Reviewer
  class JourneyService
    JOURNEYS = {
      'solar' => { title: 'Energia Solar', signal: :solar },
      'mobility' => { title: 'Mobilidade Elétrica', signal: :mobility },
      'storage' => { title: 'Armazenamento', signal: :storage },
      'consumption' => { title: 'Consumo Consciente', signal: :consumption }
    }.freeze

    def initialize(user:)
      @user = user
      @leads = Lead.where(email: user.email)
      @reviews = user.reviews
    end

    def call
      JOURNEYS.map { |id, journey| build_journey(id, journey) }
    end

    private

    def build_journey(id, journey)
      completed = completed_steps(journey[:signal])
      steps = step_catalog(journey[:signal])
      { id: id, title: journey[:title], progress: ((completed.length.to_f / steps.length) * 100).round,
        steps: steps.map { |step| { id: step, completed: completed.include?(step) } },
        next_step: steps.find { |step| !completed.include?(step) } }
    end

    def step_catalog(signal)
      return %w[understand compare evaluate] if signal == :solar
      return %w[understand infrastructure compare] if signal == :mobility
      return %w[understand evaluate] if signal == :storage

      %w[profile contribute]
    end

    def completed_steps(signal)
      case signal
      when :solar
        steps = []
        steps << 'understand' if @leads.where("LOWER(product_vertical) LIKE '%solar%'").exists?
        steps << 'evaluate' if @reviews.exists?
        steps
      when :mobility
        @leads.where("LOWER(product_vertical) LIKE '%car%' OR LOWER(product_vertical) LIKE '%ev%' OR LOWER(product_vertical) LIKE '%mobil%'").exists? ? ['understand'] : []
      when :storage
        @leads.where("LOWER(product_vertical) LIKE '%bater%'").exists? ? ['understand'] : []
      else
        @reviews.exists? ? %w[profile contribute] : ['profile']
      end
    end
  end
end
