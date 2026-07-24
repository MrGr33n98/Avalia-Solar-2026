# frozen_string_literal: true

module Api
  module V1
    class CompanyUploadLimitsController < BaseController
      before_action :authenticate_api_user!
      before_action :set_company
      before_action :ensure_company_ownership

      # GET /api/v1/companies/:company_id/upload_limits
      def show
        limit = @company.company_upload_limit || @company.create_company_upload_limit!
        limiter = CompanyUploadLimiter.new(@company)

        render json: {
          data: limit.to_h,
          can_upload: {
            images: limiter.can_upload_image?,
            videos: limiter.can_upload_video?
          },
          limits: {
            images: limiter.image_limit,
            videos: limiter.video_limit,
            projects: limiter.project_limit
          },
          upgrade: {
            available: limiter.next_tier.present?,
            tier: limiter.next_tier,
            pricing: limiter.next_tier_pricing,
            benefits: upgrade_benefits(limiter.next_tier)
          }
        }
      end

      # GET /api/v1/companies/:company_id/upload_limits/check
      def check
        limiter = CompanyUploadLimiter.new(@company)
        type = params[:type] || 'images'
        count = params[:count]&.to_i || 1

        can_proceed = case type
                      when 'images' then limiter.can_upload_image?(count)
                      when 'videos' then limiter.can_upload_video?(count)
                      when 'projects' then limiter.can_create_project?(count)
                      else false
                      end

        limit = @company.company_upload_limit || @company.create_company_upload_limit!

        if can_proceed
          render json: { allowed: true }
        else
          render json: {
            allowed: false,
            reason: "Limit of #{limiter.send("#{type}_limit")} #{type} reached",
            current: limit.send("current_#{type}_count"),
            limit: limiter.send("#{type}_limit"),
            upgrade: {
              available: limiter.next_tier.present?,
              tier: limiter.next_tier,
              pricing: limiter.next_tier_pricing
            }
          }, status: :payment_required
        end
      end

      # POST /api/v1/companies/:company_id/upload_limits/increment
      def increment
        limit = @company.company_upload_limit || @company.create_company_upload_limit!
        type = params[:type]
        count = params[:count]&.to_i || 1

        case type
        when 'images'
          limit.increment_images!(count)
        when 'videos'
          limit.increment_videos!(count)
        when 'projects'
          limit.increment_projects!(count)
        end

        render json: { success: true, limit: limit.to_h }
      end

      private

      def set_company
        @company = Company.find_by!(slug: params[:company_id])
      end

      def ensure_company_ownership
        return if current_api_user.admin?
        return if @company.company_users.exists?(user: current_api_user, role: %w[owner admin editor])

        render json: { error: 'Unauthorized' }, status: :unauthorized
      end

      def upgrade_benefits(tier)
        return [] unless tier

        case tier
        when 'essential'
          [
            'Até 15 fotos na vitrine',
            '2 vídeos de projetos',
            '5 projetos publicados',
            'Até 10 cidades de atuação'
          ]
        when 'pro'
          [
            'Até 50 fotos na vitrine',
            '10 vídeos de projetos',
            '20 projetos publicados',
            '30 cidades de atuação',
            'Analytics avançado'
          ]
        when 'enterprise'
          [
            'Fotos ilimitadas',
            'Vídeos ilimitados',
            'Projetos ilimitados',
            'Cobertura nacional',
            'API e Webhooks',
            'Suporte prioritário'
          ]
        else
          []
        end
      end
    end
  end
end