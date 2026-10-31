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

        def create
          source_name = params.dig(:source, :name)&.strip || params[:name]&.strip
          if source_name.blank?
            return render json: { error: { code: 'INVALID_NAME', message: 'Nome da origem é obrigatório' } }, status: :unprocessable_entity
          end

          existing = ::Sales::Source.where('LOWER(name) = ?', source_name.downcase).first
          if existing
            existing.update!(active: true) unless existing.active?
            return render json: { source: { id: existing.id, name: existing.name, slug: existing.slug, active: existing.active } }, status: :ok
          end

          source = ::Sales::Source.create!(name: source_name, active: true)
          render json: { source: { id: source.id, name: source.name, slug: source.slug, active: source.active } }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: { code: 'VALIDATION_ERROR', message: e.record.errors.full_messages.join(', ') } }, status: :unprocessable_entity
        end
      end
    end
  end
end
