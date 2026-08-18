# frozen_string_literal: true

module Api
  module V1
    class CreatorTreeController < BaseController
      def show
        profile = ReviewerProfile.includes(:user, creator_tree_blocks: %i[company publication])
                                  .find_by!(public_slug: params[:slug], creator_enabled: true)
        profile.with_lock { profile.increment!(:tree_views_count) }

        render json: {
          creator: {
            name: profile.user.name,
            headline: profile.public_headline,
            bio: profile.public_bio,
            slug: profile.public_slug,
            avatar_url: profile.user.avatar_url,
            city: profile.user.city,
            state: profile.user.state,
            linkedin_url: profile.linkedin_url,
            instagram_url: profile.instagram_url,
            youtube_url: profile.youtube_url,
            website_url: profile.website_url
          },
          blocks: profile.creator_tree_blocks.active_ordered.map { |block| block_payload(block) }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Creator não encontrado' }, status: :not_found
      end

      def click
        profile = ReviewerProfile.find_by!(public_slug: params[:slug], creator_enabled: true)
        block = profile.creator_tree_blocks.active.find(params[:block_id])
        block.with_lock { block.increment!(:clicks_count) }
        render json: { ok: true }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Bloco não encontrado' }, status: :not_found
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
        return block.url if block.url.present?
        return "/companies/#{block.company.slug || block.company.id}" if block.company.present?
        return "/creators/#{block.reviewer.public_slug}/posts/#{block.publication.slug}" if block.publication.present?

        '#'
      end
    end
  end
end