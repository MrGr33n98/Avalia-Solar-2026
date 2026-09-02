module Sales
  class QuoteLifecycle
    TRANSITIONS = {
      'draft' => %w[sent],
      'sent' => %w[accepted declined expired]
    }.freeze

    def self.call(quote:, to:, actor: nil)
      allowed = TRANSITIONS.fetch(quote.status, [])
      raise ArgumentError, "transição inválida: #{quote.status} para #{to}" unless allowed.include?(to)

      Quote.transaction do
        attributes = { status: to }
        attributes[:sent_at] = Time.current if to == 'sent'
        attributes[:accepted_at] = Time.current if to == 'accepted'
        quote.update!(attributes)
        quote.events.create!(event_type: to, actor: actor)
      AuditRecorder.call(record: quote, action: "quote_#{to}", actor: actor)
      end
      quote
    end
  end
end
