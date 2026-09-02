# frozen_string_literal: true

module Sales
  class ExpireQuotes
    def self.call(now: Time.current)
      Quote.where(status: 'sent').where('expires_on < ?', now.to_date).find_each do |quote|
        QuoteLifecycle.call(quote: quote, to: 'expired')
      end
    end
  end
end
