# frozen_string_literal: true

module Mcp
  module Public
    # No implicit coercion: the external JSON contract is not the internal
    # Rails service contract. All accepted fields are from PublicToolRegistry.
    class InputValidator
      class Invalid < StandardError; end

      MAX_LIMIT = 20
      MAX_STRING = 120

      class << self
        def normalize(name, arguments)
          schema = Mcp::PublicToolRegistry.find(name)&.dig('inputSchema')
          raise Invalid, 'Unknown public tool.' unless schema
          raise Invalid, 'Arguments must be a JSON object.' unless arguments.is_a?(Hash)

          args = arguments.stringify_keys
          raise Invalid, 'Unknown argument.' if (args.keys - schema.fetch('properties').keys).any?

          case name
          when 'list_integrators'
            search(args)
          when 'show_integrator_profile', 'get_integrator_reputation'
            reference(args)
          when 'get_company_services'
            result = reference(args)
            limit = args.fetch('limit', 5)
            raise Invalid, 'Limit must be between 1 and 5.' unless limit.is_a?(Integer) && limit.between?(1, 5)

            result.merge('limit' => limit)
          when 'list_solar_categories'
            categories(args)
          when 'compare_integrators'
            comparison(args)
          else
            raise Invalid, 'Unknown public tool.'
          end
        end

        private

        def string!(value, label, max: MAX_STRING)
          raise Invalid, "Invalid #{label}." unless value.is_a?(String) && value.strip.present? && value.length <= max

          value.strip
        end

        def positive_id!(value, label)
          raise Invalid, "Invalid #{label}." unless value.is_a?(Integer) && value.positive?

          value
        end

        def limit!(args)
          return 10 unless args.key?('limit')

          value = args['limit']
          raise Invalid, 'Limit must be between 1 and 20.' unless value.is_a?(Integer) && value.between?(1, MAX_LIMIT)

          value
        end

        def cursor!(args)
          return nil unless args.key?('cursor')

          string!(args['cursor'], 'cursor', max: 512)
        end

        def reference(args)
          keys = %w[company_id slug].select { |key| args.key?(key) }
          raise Invalid, 'Exactly one company identifier is required.' unless keys.size == 1

          if args.key?('company_id')
            { 'company_id' => positive_id!(args['company_id'], 'company_id') }
          else
            slug = string!(args['slug'], 'slug')
            raise Invalid, 'Invalid slug.' unless slug.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)

            { 'slug' => slug }
          end
        end

        def search(args)
          fields = %w[query category_slug headquarters_city state]
          raise Invalid, 'At least one search filter is required.' unless (fields & args.keys).any?

          result = {}
          fields.each do |field|
            result[field] = string!(args[field], field) if args.key?(field)
          end
          if result.key?('state')
            raise Invalid, 'State must have exactly two letters.' unless result['state'].match?(/\A[a-z]{2}\z/i)

            result['state'] = result['state'].upcase
          end
          if result.key?('category_slug')
            raise Invalid, 'Invalid category_slug.' unless result['category_slug'].match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
          end
          if args.key?('verified')
            raise Invalid, 'verified must be a boolean.' unless [true, false].include?(args['verified'])

            result['verified'] = args['verified']
          end
          result['limit'] = limit!(args)
          result['cursor'] = cursor!(args) if args.key?('cursor')
          result['sort'] = args.fetch('sort', 'relevance')
          raise Invalid, 'Unsupported sort.' unless %w[relevance rating review_count].include?(result['sort'])

          result
        end

        def categories(args)
          result = {}
          result['parent_id'] = positive_id!(args['parent_id'], 'parent_id') if args.key?('parent_id')
          if args.key?('vertical')
            # There is no verified vertical column/contract on Category; do not
            # silently invent a taxonomy by searching names.
            raise Invalid, 'Vertical filtering is not yet available.'
          end
          result['limit'] = limit!(args)
          result['cursor'] = cursor!(args) if args.key?('cursor')
          result
        end

        def comparison(args)
          ids = args['company_ids']
          raise Invalid, 'Exactly 2 or 3 distinct companies are required.' unless ids.is_a?(Array) && ids.length.between?(2, 3)

          normalized = ids.map do |id|
            if id.is_a?(Integer) && id.positive?
              id
            elsif id.is_a?(String) && id.length <= MAX_STRING && id.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
              id
            else
              raise Invalid, 'Invalid company reference.'
            end
          end
          raise Invalid, 'Duplicate company references.' unless normalized.map(&:to_s).uniq.length == normalized.length

          criteria = args.fetch('criteria', %w[reputation categories headquarters declared_coverage services])
          allowed = %w[reputation categories headquarters declared_coverage services]
          raise Invalid, 'Invalid comparison criteria.' unless criteria.is_a?(Array) &&
                                                              criteria.length.between?(1, allowed.length) &&
                                                              criteria.uniq == criteria && (criteria - allowed).empty?

          { 'company_ids' => normalized, 'criteria' => criteria }
        end
      end
    end
  end
end
