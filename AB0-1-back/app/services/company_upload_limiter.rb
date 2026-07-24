# frozen_string_literal: true

class CompanyUploadLimiter
  # Limites por tier de plano
  TIER_LIMITS = {
    'free' => {
      images: 3,
      videos: 0,
      projects: 1,
      galleries_per_project: 1
    },
    'essential' => {
      images: 15,
      videos: 2,
      projects: 5,
      galleries_per_project: 3
    },
    'pro' => {
      images: 50,
      videos: 10,
      projects: 20,
      galleries_per_project: 5
    },
    'enterprise' => {
      images: Float::INFINITY,
      videos: Float::INFINITY,
      projects: Float::INFINITY,
      galleries_per_project: Float::INFINITY
    }
  }.freeze

  PRICING = {
    'pro' => { monthly: 49, yearly: 499 },
    'enterprise' => { monthly: 99, yearly: 999 }
  }.freeze

  attr_reader :company

  def initialize(company)
    @company = company
  end

  # Verifica se pode fazer upload de imagem
  def can_upload_image?(count = 1)
    current = current_image_count
    limit = image_limit
    return true if limit == Float::INFINITY

    current + count <= limit
  end

  # Verifica se pode fazer upload de vídeo
  def can_upload_video?(count = 1)
    current = current_video_count
    limit = video_limit
    return true if limit == Float::INFINITY

    current + count <= limit
  end

  # Verifica se pode criar novo projeto
  def can_create_project?(count = 1)
    current = current_project_count
    limit = project_limit
    return true if limit == Float::INFINITY

    current + count <= limit
  end

  # Retorna os limites atuais
  def limits
    tier = current_tier
    TIER_LIMITS[tier] || TIER_LIMITS['free']
  end

  def image_limit
    limits[:images]
  end

  def video_limit
    limits[:videos]
  end

  def project_limit
    limits[:projects]
  end

  def galleries_per_project_limit
    limits[:galleries_per_project]
  end

  # Contagens atuais
  def current_image_count
    company.company_projects.sum { |p| p.digital_assets.images.count }
  end

  def current_video_count
    company.company_projects.sum { |p| p.digital_assets.videos.count }
  end

  def current_project_count
    company.company_projects.count
  end

  # Tier atual
  def current_tier
    return 'enterprise' if company.feature_enabled?('projects_showcase_enterprise')
    return 'pro' if company.feature_enabled?('projects_showcase_pro')
    return 'essential' if company.feature_enabled?('projects_showcase')
    'free'
  end

  # Próximo tier recomendado
  def next_tier
    case current_tier
    when 'free' then 'essential'
    when 'essential' then 'pro'
    when 'pro' then 'enterprise'
    else nil
    end
  end

  # Preço do próximo tier
  def next_tier_pricing
    tier = next_tier
    return nil unless tier

    PRICING[tier]
  end

  # Verifica se está próximo do limite (80% ou mais)
  def near_limit?(type = :images, threshold = 0.8)
    current = case type
              when :images then current_image_count
              when :videos then current_video_count
              when :projects then current_project_count
              else 0
              end

    limit = case type
            when :images then image_limit
            when :videos then video_limit
            when :projects then project_limit
            else 0
            end

    return false if limit == Float::INFINITY || limit.zero?

    (current.to_f / limit) >= threshold
  end

  # Retorna porcentagem de uso
  def usage_percentage(type = :images)
    current = case type
              when :images then current_image_count
              when :videos then current_video_count
              when :projects then current_project_count
              else 0
              end

    limit = case type
            when :images then image_limit
            when :videos then video_limit
            when :projects then project_limit
            else 1
            end

    return 100 if limit == Float::INFINITY
    return 0 if limit.zero?

    [(current.to_f / limit * 100).round, 100].min
  end

  # Serializa para API
  def to_h
    {
      tier: current_tier,
      limits: {
        images: image_limit == Float::INFINITY ? nil : image_limit,
        videos: video_limit == Float::INFINITY ? nil : video_limit,
        projects: project_limit == Float::INFINITY ? nil : project_limit,
        galleries_per_project: galleries_per_project_limit == Float::INFINITY ? nil : galleries_per_project_limit
      },
      usage: {
        images: current_image_count,
        videos: current_video_count,
        projects: current_project_count
      },
      percentages: {
        images: usage_percentage(:images),
        videos: usage_percentage(:videos),
        projects: usage_percentage(:projects)
      },
      near_limits: {
        images: near_limit?(:images),
        videos: near_limit?(:videos),
        projects: near_limit?(:projects)
      },
      can_upgrade: next_tier.present?,
      next_tier: next_tier,
      next_tier_pricing: next_tier_pricing
    }
  end
end