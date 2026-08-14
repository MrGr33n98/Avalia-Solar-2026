module Api
  module V1
    class CreatorLeadsController < Api::V1::BaseController

      def create
        profile = ReviewerProfile.find_by(public_slug: params[:creator_slug], creator_enabled: true)
        return head :not_found unless profile
        attrs = lead_params
        publication = profile.user.reviewer_publications.published.find_by(id: attrs[:publication_id]) if attrs[:publication_id].present?
        return head :not_found if attrs[:publication_id].present? && publication.nil?
        attrs.delete(:publication_id)
        lead = CreatorLead.new(attrs.merge(creator_user: profile.user, publication: publication, consent_at: Time.current, ip_address: request.remote_ip, user_agent: request.user_agent))
        return render json: { errors: lead.errors.full_messages }, status: :unprocessable_entity unless lead.save
        render json: { accepted: true }, status: :created
      end

      private

      def lead_params
        params.require(:lead).permit(:name, :email, :phone, :message, :intent, :source, :utm_source, :utm_medium, :utm_campaign, :publication_id)
      end
    end
  end
end
