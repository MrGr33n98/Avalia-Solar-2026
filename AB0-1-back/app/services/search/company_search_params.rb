# frozen_string_literal: true

module Search
  # Request-boundary value object: validates company-search pagination/filter input.
  # Business filtering and ordering remain in CompanySearchService.
  class CompanySearchParams
    MAX_PAGE = 100_000
    MAX_PER_PAGE = 100
    ALLOWED_SORTS = %w[
      recommended rating rating_desc reviews_count reviews_desc
      newest created_at name name_asc name_desc
      price_asc price_desc
    ].freeze

    attr_reader :query, :state, :city, :sort, :page, :per_page, :verified

    def initialize(raw)
      @query = raw[:q].to_s.strip
      @state = raw[:state].to_s.strip.presence
      @city = raw[:city].to_s.strip.presence
      requested_sort = raw[:sort].to_s
      @sort = ALLOWED_SORTS.include?(requested_sort) ? requested_sort : 'recommended'
      @page = positive_integer(raw[:page], default: 1, max: MAX_PAGE)
      @per_page = positive_integer(raw[:per_page], default: 10, max: MAX_PER_PAGE)
      @verified = parse_boolean(raw[:verified])
      freeze
    end

    private

    def positive_integer(value, default:, max:)
      parsed = value.to_s
      return default unless parsed.match?(/\A[1-9]\d*\z/)
      integer = parsed.to_i
      integer <= max ? integer : default
    end

    def parse_boolean(value)
      return true if value == true || value.to_s == 'true'
      return false if value == false || value.to_s == 'false'
      nil
    end
  end
end
