# frozen_string_literal: true

module Mcp
  module Public
    # Approved-only public reputation aggregates. Never serialize Review,
    # reviewer identity, moderation notes or review body into an MCP response.
    class ReputationService
      def call(arguments:)
        args = InputValidator.normalize('get_integrator_reputation', arguments)
        company = args.key?('company_id') ? Company.active.find_by(id: args['company_id']) :
                  Company.active.find_by(slug: args['slug'])
        raise DirectoryService::NotFound, 'Company not found.' unless company

        approved = Review.approved_only.where(company_id: company.id)
        total = approved.count
        dist = approved.group(:rating).count.each_with_object({}) do |(rating, count), memo|
          memo[rating.to_i.to_s] = count
        end
        distribution = (1..5).to_h { |rating| [rating.to_s, dist.fetch(rating.to_s, 0)] }

        {
          schema_version: Mcp::PublicToolRegistry::CONTRACT_VERSION,
          data_as_of: Time.current.utc.iso8601,
          source_type: 'review_aggregate',
          data: {
            total_approved: total,
            average_rating: total.positive? ? approved.average(:rating)&.to_f&.round(2) : nil,
            rating_distribution: distribution,
            verified_total: approved.where(verified: true).count,
            replied_total: approved.where.not(reply: [nil, '']).count,
            sample_size: total
          },
          limitations: [
            'Somente avaliações aprovadas são incluídas.',
            'Amostras pequenas podem não representar toda a experiência dos clientes.',
            'Não há inferência de qualidade quando a amostra é vazia.'
          ]
        }
      end
    end
  end
end
