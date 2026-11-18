# frozen_string_literal: true

module Mcp
  module Private
    class CompanyContext
      def self.resolve!(user:, selector: nil)
        new(user: user, selector: selector).resolve!
      end

      def initialize(user:, selector:)
        @user = user
        @selector = selector.to_s.presence
      end

      def resolve!
        memberships = @user.company_members.active.includes(:company).select do |membership|
          membership.company&.status == 'active'
        end
        candidates = memberships.map(&:company).compact
        company = selected_company(candidates)
        unless company
          raise Mcp::Error.new(code: 'forbidden', message: 'Contexto empresarial não autorizado.',
                               status: :forbidden)
        end

        company
      end

      private

      def selected_company(candidates)
        return candidates.first if @selector.blank? && candidates.one?
        return nil if @selector.blank?

        candidates.find { |company| company.id.to_s == @selector || company.slug == @selector }
      end
    end
  end
end
