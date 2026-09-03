# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SourcesController < BaseController
        def index
          sources = ::Sales::Source.active.order(:name)
          if sources.empty?
            defaults = ['Outbound', 'Inbound', 'Avalia Solar Marketplace', 'Referral', 'Google', 'LinkedIn', 'WhatsApp', 'Event', 'Partner', 'Other']
            defaults.each { |n| ::Sales::Source.create!(name: n) }
            sources = ::Sales::Source.active.order(:name)
          end
          render json: { sources: sources.map { |s| { id: s.id, name: s.name, slug: s.slug } } }
        end
      end
    end
  end
end
