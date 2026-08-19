# frozen_string_literal: true

require 'uri'

module Api
  module V1
    class CreatorTreeController < BaseController
      def show
        profile = ReviewerProfile.find_by!(public_slug: params[:slug], creator_enabled: true)
        blocks = CreatorTreeBlock.where(reviewer_id: profile.id, active: true)
           .includes(:company, :publication, :reviewer)
               .order(:position, :id)

        render json: {
          creator: Creator::IdentityProjection.resolve(profile),
          blocks: blocks.select { |block| block.block_type == 'separator' || block_destination(block).present? }
                       .map { |block| block_payload(block) }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Creator não encontrado' }, status: :not_found
      end

      def view
        profile = ReviewerProfile.find_by!(public_slug: params[:slug], creator_enabled: true)
        profile.with_lock { profile.increment!(:tree_views_count) }
        render json: { ok: true }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Creator não encontrado' }, status: :not_found
      rescue StandardError => e
        Rails.logger.warn("[CreatorTree] view tracking failed: #{e.class}: #{e.message}")
        render json: { ok: false }, status: :accepted
      end

      def click
        profile = ReviewerProfile.find_by!(public_slug: params[:slug], creator_enabled: true)
        block = profile.creator_tree_blocks.active.find(params[:block_id])
        block.with_lock { block.increment!(:clicks_count) }
        render json: { ok: true }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Bloco não encontrado' }, status: :not_found
      rescue StandardError => e
        Rails.logger.warn("[CreatorTree] click tracking failed: #{e.class}: #{e.message}")
        render json: { ok: false }, status: :accepted
      end

      private

      def block_payload(block)
        {
          id: block.id,
          type: block.block_type,
          title: block.title,
          subtitle: block.subtitle,
          url: block_destination(block),
          position: block.position,
          metadata: block.metadata
        }
      end

      def block_destination(block)
        case block.block_type
        when 'external_link', 'social', 'download'
          valid_external_url(block.url)
        when 'whatsapp'
          valid_whatsapp_url(block.url)
        when 'company'
          owned_company = block.company && block.reviewer.user.active_member_companies.exists?(id: block.company.id)
          owned_company ? "/companies/#{block.company.slug || block.company.id}" : nil
        when 'publication'
          owned_publication = block.publication && block.publication.user_id == block.reviewer.user_id
          owned_publication ? "/creators/#{block.reviewer.public_slug}/posts/#{block.publication.slug}" : nil
        when 'lead_form'
          "/creators/#{block.reviewer.public_slug}#contato"
        when 'separator'
          nil
        end
      end

      def valid_external_url(value)
        uri = URI.parse(value.to_s)
        value if uri.is_a?(URI::HTTP) && uri.host.present?
      rescue URI::InvalidURIError
        nil
      end

      def valid_whatsapp_url(value)
        digits = value.to_s.gsub(/\D/, '')
        digits.present? ? "https://wa.me/#{digits}" : nil
      end
    end
  end
end