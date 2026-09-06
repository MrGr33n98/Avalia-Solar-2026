# frozen_string_literal: true

module Sales
  module Campaigns
    class AudienceResolver
      def self.call(company: nil, company_id: nil, audience_filter: nil, filter: nil, page: 1, per_page: 50)
        target_company = company || Company.find_by(id: company_id)
        target_filter = audience_filter || filter || {}
        new(company: target_company, audience_filter: target_filter, page: page, per_page: per_page).call
      end

      def initialize(company:, audience_filter: {}, page: 1, per_page: 50)
        @company = company
        @filter = (audience_filter || {}).with_indifferent_access
        @page = [page.to_i, 1].max
        @per_page = [[per_page.to_i, 1].max, 500].min
      end

      def call
        return { records: ::Sales::Contact.none, total_count: 0, page: @page, per_page: @per_page, total_pages: 0 } unless @company

        scope = base_contacts_scope

        # Apply segment filter
        if @filter[:segment].present?
          scope = scope.joins(:account).where(sales_accounts: { segment: @filter[:segment] })
        end

        # Apply geography filter (state/city)
        if @filter[:state].present?
          scope = scope.joins(:account).where(sales_accounts: { state: @filter[:state] })
        end
        if @filter[:city].present?
          scope = scope.joins(:account).where(sales_accounts: { city: @filter[:city] })
        end

        # Apply search term
        if @filter[:search].present?
          term = "%#{@filter[:search].to_s.downcase}%"
          scope = scope.where('LOWER(sales_contacts.first_name) LIKE :term OR LOWER(sales_contacts.last_name) LIKE :term OR LOWER(sales_contacts.email) LIKE :term', term: term)
        end

        # Filter by tags if present
        if @filter[:tag_ids].present? && @filter[:tag_ids].is_a?(Array)
          tag_ids = @filter[:tag_ids].map(&:to_i).reject(&:zero?)
          if tag_ids.any?
            if defined?(::Sales::Tagging) && ::Sales::Tagging.column_names.include?('sales_tag_id')
              scope = scope.joins(:taggings).where(sales_taggings: { sales_tag_id: tag_ids })
            elsif defined?(::Sales::Tagging) && ::Sales::Tagging.column_names.include?('tag_id')
              scope = scope.joins(:taggings).where(sales_taggings: { tag_id: tag_ids })
            end
          end
        end

        # Exclude suppressed emails (Opt-Out / Bounce) via SQL NOT EXISTS subquery
        if ActiveRecord::Base.connection.table_exists?('sales_email_suppressions')
          scope = scope.where(
            'NOT EXISTS (SELECT 1 FROM sales_email_suppressions WHERE sales_email_suppressions.company_id = ? AND LOWER(sales_email_suppressions.email) = LOWER(sales_contacts.email))',
            @company.id
          )
        end

        total_count = scope.distinct.count('sales_contacts.id')
        records = scope.distinct.includes(:account).order('sales_contacts.id ASC').page(@page).per(@per_page)

        {
          records: records,
          total_count: total_count,
          page: @page,
          per_page: @per_page,
          total_pages: (total_count.to_f / @per_page).ceil
        }
      end

      private

      def base_contacts_scope
        return ::Sales::Contact.none unless @company.present?

        user_ids = User.where(company_id: @company.id).pluck(:id)
        account_ids = ::Sales::Account.where(company_id: @company.id).or(::Sales::Account.where(owner_id: user_ids)).pluck(:id)

        scope = ::Sales::Contact.where(sales_account_id: account_ids.presence || [0])
        if ::Sales::Contact.column_names.include?('company_id')
          scope = scope.or(::Sales::Contact.where(company_id: @company.id))
        end
        scope.where.not(email: [nil, ''])
      end
    end
  end
end
