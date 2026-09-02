# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SearchController < BaseController
        def index
          query = params[:q].to_s.strip
          return render json: { results: [] } if query.length < 2

          term = "%#{query.downcase}%"

          accounts = ::Sales::Account.where('LOWER(name) LIKE ? OR LOWER(city) LIKE ? OR LOWER(domain) LIKE ?', term, term, term).limit(5)
          contacts = ::Sales::Contact.where('LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ?', term, term, term).limit(5)
          opportunities = ::Sales::Opportunity.where('LOWER(name) LIKE ?', term).limit(5)

          results = []

          accounts.each do |a|
            results << { id: a.id, type: 'account', title: a.name, subtitle: "#{a.city || 'Sem cidade'}/#{a.state || 'UF'}", account_id: a.id }
          end

          contacts.each do |c|
            name = [c.first_name, c.last_name].compact.join(' ')
            results << { id: c.id, type: 'contact', title: name, subtitle: c.job_title || c.email, account_id: c.sales_account_id }
          end

          opportunities.each do |o|
            results << { id: o.id, type: 'opportunity', title: o.name, subtitle: "R$ #{((o.value_cents || 0) / 100).to_s}", account_id: o.sales_account_id }
          end

          render json: { results: results }
        end
      end
    end
  end
end
