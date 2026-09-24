# frozen_string_literal: true

module Coverage
  class ConsumerAdapter
    CONSUMERS = %w[search leads recommendation mobivolt seo ranking profile].freeze

    def self.canonical_enabled?(consumer)
      flag_key = "ENABLE_CANONICAL_COVERAGE_#{consumer.to_s.upcase}"
      ENV[flag_key] == 'true' || ENV['ENABLE_CANONICAL_COVERAGE_ALL'] == 'true'
    end

    def self.serves_city?(company, city, state = nil, consumer: 'default')
      if canonical_enabled?(consumer)
        res = Coverage::CoverageResolver.resolve(company, state: state, city: city)
        res.covered?
      else
        if shadow_enabled?
          Coverage::ShadowComparator.compare(company, state: state, city: city, consumer: consumer.to_s)
        end
        company.respond_to?(:serves_city?) ? company.serves_city?(city, state) : false
      end
    end

    def self.serves_state?(company, state, consumer: 'default')
      if canonical_enabled?(consumer)
        res = Coverage::CoverageResolver.resolve(company, state: state)
        res.covered?
      else
        if shadow_enabled?
          Coverage::ShadowComparator.compare(company, state: state, city: nil, consumer: consumer.to_s)
        end
        company.respond_to?(:serves_state?) ? company.serves_state?(state) : false
      end
    end

    def self.shadow_enabled?
      ENV['ENABLE_COVERAGE_SHADOW_LOG'] == 'true'
    end
  end
end
