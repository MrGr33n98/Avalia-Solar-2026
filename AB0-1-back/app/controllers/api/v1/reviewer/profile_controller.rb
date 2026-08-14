module Api
  module V1
    module Reviewer
      class ProfileController < Api::V1::Reviewer::BaseController

        def show
          render json: profile_payload
        end

        def update
          profile = current_user.reviewer_profile || current_user.build_reviewer_profile
          ReviewerProfile.transaction do
            profile.assign_attributes(profile_params)
            profile.save!
            ::Reviewer::PublicSlugService.new(profile).call if profile.creator_enabled? && profile.public_slug.blank?
          end

          ::Creator::PublicProfileService.invalidate(profile)
          render json: profile_payload
        rescue ActiveRecord::RecordInvalid => e
          render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def avatar
          upload = params[:avatar]
          return render json: { error: 'Avatar obrigatório' }, status: :unprocessable_entity unless upload
          return render json: { error: 'Formato inválido' }, status: :unprocessable_entity unless %w[image/jpeg image/png image/webp].include?(upload.content_type)
          return render json: { error: 'Avatar excede 5 MB' }, status: :unprocessable_entity if upload.size > 5.megabytes

          current_user.avatar.attach(upload)
          render json: profile_payload
        end

        def public_banner
          upload = params[:public_banner]
          return render json: { error: 'Banner obrigatório' }, status: :unprocessable_entity unless upload
          return render json: { error: 'Formato inválido' }, status: :unprocessable_entity unless %w[image/jpeg image/png image/webp].include?(upload.content_type)
          return render json: { error: 'Banner excede 8 MB' }, status: :unprocessable_entity if upload.size > 8.megabytes

          profile = current_user.reviewer_profile || current_user.build_reviewer_profile
          profile.public_banner.attach(upload)
          Creator::PublicProfileService.invalidate(profile)
          render json: profile_payload
        end

        def remove_avatar
          current_user.avatar.purge
          render json: profile_payload
        end

        private


        def profile_params
          params.require(:profile).permit(:profession, :company_name, :bio, :birth_date, :linkedin_url, :instagram_url, :website_url, :youtube_url, :public_profile, :public_headline, :public_bio, :public_email_enabled, :lead_capture_enabled, :creator_enabled)
        end

        def profile_payload
          profile = current_user.reviewer_profile
          profile_data = profile&.attributes&.slice('profession', 'company_name', 'bio', 'birth_date', 'linkedin_url', 'instagram_url', 'website_url', 'youtube_url', 'public_profile', 'public_slug', 'creator_enabled', 'public_headline', 'public_bio', 'public_email_enabled', 'lead_capture_enabled') || {}
          profile_data['public_banner_url'] = profile.public_banner.attached? ? rails_blob_url(profile.public_banner) : nil if profile
          { user: { id: current_user.id, name: current_user.name, email: current_user.email, phone: current_user.phone, city: current_user.city, state: current_user.state, avatar_url: current_user.respond_to?(:avatar_url) ? current_user.avatar_url : nil }, profile: profile_data }
        end
      end
    end
  end
end
