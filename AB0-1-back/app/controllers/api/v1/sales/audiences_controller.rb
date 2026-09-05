# frozen_string_literal: true

module Api
  module V1
    module Sales
      class AudiencesController < BaseController
        def preview
          company = current_user.company || Company.first
          filter = params[:audience_filter] || params[:filter] || {}
          page = params[:page] || 1
          per_page = params[:per_page] || 20

          result = ::Sales::Campaigns::AudienceResolver.call(
            company: company,
            audience_filter: filter,
            page: page,
            per_page: per_page
          )

          sample_contacts = result[:records].map do |c|
            {
              id: c.id,
              first_name: c.first_name,
              last_name: c.last_name,
              email: c.email,
              job_title: c.job_title,
              account_name: c.account&.name,
              city: c.account&.city,
              state: c.account&.state
            }
          end

          render json: {
            total_count: result[:total_count],
            page: result[:page],
            per_page: result[:per_page],
            total_pages: result[:total_pages],
            sample_contacts: sample_contacts
          }
        end

        def segments
          company = current_user.company || Company.first
          user_ids = User.where(company_id: company.id).pluck(:id)
          accounts = ::Sales::Account.where(company_id: company.id).or(::Sales::Account.where(owner_id: user_ids))

          states = accounts.where.not(state: [nil, '']).distinct.pluck(:state).sort
          cities = accounts.where.not(city: [nil, '']).distinct.pluck(:city).sort
          company_types = accounts.where.not(segment: [nil, '']).distinct.pluck(:segment).sort
          tags = ::Sales::Tag.where(company_id: company.id).map { |t| { id: t.id, name: t.name, color: t.color } }

          render json: {
            states: states,
            cities: cities,
            company_types: company_types,
            tags: tags
          }
        end
      end
    end
  end
end
