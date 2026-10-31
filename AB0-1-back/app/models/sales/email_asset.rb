# frozen_string_literal: true

require 'digest'

module Sales
  class EmailAsset < ApplicationRecord
    self.table_name = 'sales_email_assets'

    KINDS = %w[logo banner photo product other].freeze
    STATUSES = %w[pending processing ready failed archived].freeze
    ALLOWED_MIME_TYPES = %w[image/jpeg image/png image/webp].freeze
    MAX_BYTE_SIZE = 5.megabytes
    MAX_DIMENSION_PX = 1600

    belongs_to :company
    belongs_to :uploaded_by, class_name: 'User'

    has_one_attached :file

    validates :name, presence: true
    validates :kind, inclusion: { in: KINDS }
    validates :status, inclusion: { in: STATUSES }
    validates :mime_type, inclusion: { in: ALLOWED_MIME_TYPES }
    validates :byte_size, numericality: { greater_than: 0, less_than_or_equal_to: MAX_BYTE_SIZE }

    scope :active, -> { where(deleted_at: nil).where.not(status: 'archived') }
    scope :ready, -> { active.where(status: 'ready') }
    scope :by_kind, ->(kind) { where(kind: kind) if kind.present? && KINDS.include?(kind.to_s) }
    scope :search_by_name, ->(query) {
      if query.present?
        q = "%#{sanitize_sql_like(query.to_s.strip.downcase)}%"
        where('LOWER(name) LIKE ? OR LOWER(alt_text) LIKE ?', q, q)
      end
    }

    def ready?
      status == 'ready' && file.attached?
    end

    def archived?
      status == 'archived' || deleted_at.present?
    end

    def archive!
      update!(status: 'archived', deleted_at: Time.current)
    end

    def in_use_by_campaigns?
      return false unless defined?(::Sales::Campaign)

      # Checa snapshots de campanhas da empresa contendo este asset_id
      ::Sales::Campaign
        .where(company_id: company_id)
        .where("template_snapshot::text LIKE ?", "%\"asset_id\":#{id}%")
        .exists?
    end

    def in_use_by_templates?
      return false unless defined?(::Sales::EmailTemplate)

      ::Sales::EmailTemplate
        .where(company_id: company_id)
        .where("body_json::text LIKE ?", "%\"asset_id\":#{id}%")
        .exists?
    end

    def resolve_public_url
      return public_url if public_url.present?
      return nil unless file.attached?

      begin
        host_origin = ENV['EMAIL_ASSETS_HOST'].presence ||
                      ENV['ACTIVE_STORAGE_HOST'].presence ||
                      ENV['APP_HOST'].presence ||
                      (Rails.env.test? ? 'http://www.example.com' : 'https://api.avaliasolar.com.br')
        uri = URI.parse(host_origin)
        options = {
          host: uri.host || host_origin,
          protocol: uri.scheme || 'https',
          port: (Rails.env.development? && uri.port ? uri.port : nil)
        }.compact

        Rails.application.routes.url_helpers.rails_storage_proxy_url(file, options)
      rescue StandardError => e
        Rails.logger.warn("[Sales::EmailAsset] Falha ao resolver URL publica: #{e.message}")
        nil
      end
    end
  end
end
