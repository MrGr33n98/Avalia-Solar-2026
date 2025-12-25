module Api
  module V1
    class CompanyDashboardBannersController < Api::V1::BaseController
      before_action :authenticate_api_user
      before_action :require_company_user
      before_action :ensure_company
      before_action -> { authorize_feature!('banners') }

      def index
        banners = current_company.banners.order(created_at: :desc)
        render json: { banners: banners.as_json(methods: %i[image_url link_url]) }
      end

      def create
        banner = current_company.banners.new(banner_params)
        banner.moderation_status = 'draft' if banner.respond_to?(:moderation_status) && banner.moderation_status.blank?
        banner.active = false if banner.respond_to?(:active)
        attach_image!(banner)
        banner.save!

        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }, status: :created
      end

      def update
        banner = current_company.banners.find(params[:id])
        banner.assign_attributes(banner_params)
        attach_image!(banner) if params[:image].present?
        banner.save!

        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def submit
        banner = current_company.banners.find(params[:id])
        banner.submit_for_review! if banner.respond_to?(:submit_for_review!)
        render json: { banner: banner.as_json(methods: %i[image_url link_url]) }
      end

      def destroy
        banner = current_company.banners.find(params[:id])
        banner.destroy!
        head :no_content
      end

      private

      def ensure_company
        render(json: { error: 'company_not_found' }, status: :not_found) unless current_company
      end

      def current_company
        current_user&.company
      end

      def authorize_feature!(feature_name)
        return true if current_company&.feature_enabled?(feature_name)

        render json: { error: 'plan_upgrade_required', feature: feature_name }, status: :forbidden
        false
      end

      def banner_params
        params.permit(
          :title,
          :link,
          :active,
          :sponsored,
          :banner_type,
          :position,
          :category_id,
          :start_date,
          :end_date
        )
      end

      def attach_image!(banner)
        return unless params[:image].present?

        banner.image.attach(params[:image])
      end
    end
  end
end
