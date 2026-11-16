# frozen_string_literal: true

module Api
  module V1
    # Company-owned, institution-only hero images. NOT advertising campaigns.
    class CompanyDashboardHeroSlidesController < Api::V1::BaseController
      before_action :authenticate_api_user
      before_action :require_company_user
      before_action :ensure_company!
      before_action :authorize_read!
      before_action :authorize_management!, except: :index

      def index
        enabled = BrandHero::Eligibility.allowed?(current_company)
        revisions = if enabled
                      current_company.company_hero_slides.order(slot: :asc, revision: :desc).limit(30)
                    else
                      CompanyHeroSlide.none
                    end
        render json: {
          enabled: enabled,
          limit: enabled ? 3 : 0,
          public_version: public_version,
          slides: revisions.map { |slide| serialize_slide(slide) }
        }
      end

      def create
        slot = integer_slot(params[:slot])
        return render_invalid('invalid_slot') unless slot

        request_key = request.headers['Idempotency-Key'].to_s.strip.presence
        if request_key && (request_key.bytesize > 80 || !request_key.match?(/\A[a-zA-Z0-9_-]+\z/))
          return render_invalid('invalid_idempotency_key')
        end

        slide = nil
        current_company.with_lock do
          if request_key
            slide = current_company.company_hero_slides.find_by(request_key: request_key)
          end
          unless slide
            revision = current_company.company_hero_slides.where(slot: slot).maximum(:revision).to_i + 1
            slide = current_company.company_hero_slides.new(
              slot: slot, display_position: slot, revision: revision,
              status: 'draft', source: 'dashboard', created_by_id: current_user.id,
              request_key: request_key, alt_text: params[:alt_text].to_s
            )
            BrandHero::ImageIngest.call(slide: slide, upload: params[:file])
            slide.save!
          end
        end
        render json: { slide: serialize_slide(slide) }, status: :created
      rescue BrandHero::ImageIngest::InvalidImage => e
        render json: { error: 'invalid_image', message: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: 'invalid_slide', message: e.record.errors.full_messages.join(', ') },
               status: :unprocessable_entity
      end

      def update
        slide = find_slide!
        return render_invalid('immutable_revision') unless %w[draft rejected].include?(slide.status)

        BrandHero::ImageIngest.call(slide: slide, upload: params[:file]) if params[:file].present?
        slide.update!(alt_text: params[:alt_text].presence || slide.alt_text, status: 'draft')
        render json: { slide: serialize_slide(slide) }
      rescue BrandHero::ImageIngest::InvalidImage => e
        render json: { error: 'invalid_image', message: e.message }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: 'invalid_slide', message: e.record.errors.full_messages.join(', ') },
               status: :unprocessable_entity
      end

      def submit
        slide = find_slide!
        return render_invalid('invalid_state') unless %w[draft rejected].include?(slide.status)
        return render_invalid('missing_image_metadata') unless slide.ready_for_publication?

        slide.update!(status: 'pending_review', rejection_reason: nil)
        render json: { slide: serialize_slide(slide) }
      end

      def reorder
        order = params[:slide_ids]
        return render_invalid('invalid_order') unless order.is_a?(Array)
        ids = order.map { |id| Integer(id, exception: false) }
        return render_invalid('invalid_order') if ids.any?(&:nil?) || ids.uniq.size != ids.size

        company = current_company
        company.with_lock do
          published = company.company_hero_slides.where(status: 'published').order(:id).to_a
          return render_invalid('invalid_order') unless ids.sort == published.map(&:id).sort
          return render json: { error: 'stale_revision' }, status: :conflict if request.headers['If-Match'].to_s != public_version

          ids.each_with_index do |id, index|
            published.find { |s| s.id == id }.update!(display_position: index + 1)
          end
        end
        render json: { public_version: public_version }
      end

      def destroy
        slide = find_slide!
        # Archive, never purge the original file and never hard-delete a live asset.
        slide.update!(status: 'archived', archived_at: Time.current)
        head :no_content
      end

      private

      def ensure_company!
        render(json: { error: 'company_not_found' }, status: :not_found) unless current_company
      end

      def current_company
        @current_company ||= if current_user&.admin?
                               ::Company.find_by(id: params[:company_id]) || current_user.company
                             else
                               # An explicit tenant ID must never silently fall back to
                               # another company in this authenticated write surface.
                               explicit_id = params[:company_id].presence
                               if explicit_id
                                 current_user.active_membership_for?(explicit_id) ?
                                   ::Company.find_by(id: explicit_id) : nil
                               else
                                 candidate_id = cookies.signed[:active_company_id] || current_user.company_id
                                 if candidate_id && current_user.active_membership_for?(candidate_id)
                                   ::Company.find_by(id: candidate_id)
                                 else
                                   current_user.active_member_companies.first
                                 end
                               end
                             end
      end

      def authorize_read!
        authorize current_company, :view_banners?, policy_class: CompanyDashboardPolicy
      end

      def authorize_management!
        authorize current_company, :update_banner?, policy_class: CompanyDashboardPolicy
        return if performed?

        return if BrandHero::Eligibility.allowed?(current_company)

        render json: { error: 'feature_locked', feature: 'brand_hero_carousel' }, status: :forbidden
      end

      def find_slide!
        current_company.company_hero_slides.find(params[:id])
      end

      def integer_slot(value)
        n = Integer(value, exception: false)
        n if (1..3).cover?(n)
      end

      def render_invalid(code)
        render json: { error: code }, status: :unprocessable_entity
      end

      def serialize_slide(slide)
        {
          id: slide.id, slot: slide.slot, position: slide.display_position,
          revision: slide.revision, status: slide.status,
          alt_text: slide.alt_text, width: slide.image_width, height: slide.image_height,
          image_url: (attachment_url(slide.image) if slide.image.attached?),
          rejection_reason: slide.rejection_reason, published_at: slide.published_at,
          updated_at: slide.updated_at
        }
      end

      def attachment_url(attachment)
        options = Rails.application.routes.default_url_options.dup
        Rails.application.routes.url_helpers.rails_storage_proxy_url(attachment, options)
      rescue StandardError
        nil
      end

      def public_version
        published = current_company.company_hero_slides.where(status: 'published')
        Digest::SHA256.hexdigest(published.order(:id).pluck(:id, :display_position, :updated_at).flatten.join(':'))[0, 16]
      end
    end
  end
end
