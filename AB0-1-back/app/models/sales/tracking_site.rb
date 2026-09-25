# frozen_string_literal: true

module Sales
  class TrackingSite < ApplicationRecord
    self.table_name = 'sales_tracking_sites'

    belongs_to :company

    before_validation :assign_public_key, on: :create
    before_validation :normalize_origins

    validates :public_key, presence: true, uniqueness: true
    validates :company_id, uniqueness: true
    validate :origins_are_valid

    def self.normalize_origin(value)
      uri = URI.parse(value.to_s.strip)
      return unless allowed_origin?(uri)

      origin_with_port(uri)
    rescue URI::InvalidURIError
      nil
    end

    def self.allowed_origin?(uri)
      valid_scheme_and_host?(uri) && empty_credentials?(uri) && root_path?(uri) && secure_origin?(uri)
    end
    private_class_method :allowed_origin?

    def self.valid_scheme_and_host?(uri)
      %w[http https].include?(uri.scheme) && uri.host.present?
    end
    private_class_method :valid_scheme_and_host?

    def self.empty_credentials?(uri)
      [uri.userinfo, uri.query, uri.fragment].all?(&:blank?)
    end
    private_class_method :empty_credentials?

    def self.root_path?(uri)
      uri.path.blank? || uri.path == '/'
    end
    private_class_method :root_path?

    def self.secure_origin?(uri)
      uri.scheme == 'https' || (!Rails.env.production? && local_origin?(uri))
    end
    private_class_method :secure_origin?

    def self.local_origin?(uri)
      uri.scheme == 'http' && %w[localhost 127.0.0.1].include?(uri.host)
    end
    private_class_method :local_origin?

    def self.origin_with_port(uri)
      host = uri.port == uri.default_port ? uri.host.downcase : "#{uri.host.downcase}:#{uri.port}"
      "#{uri.scheme}://#{host}"
    end
    private_class_method :origin_with_port

    private

    def assign_public_key
      self.public_key ||= SecureRandom.urlsafe_base64(32)
    end

    def normalize_origins
      self.allowed_origins = Array(allowed_origins).filter_map { |origin| normalize_origin(origin) }.uniq
    end

    def origins_are_valid
      return if allowed_origins.present? && Array(allowed_origins).length <= 20

      errors.add(:allowed_origins, 'deve conter de 1 a 20 origens HTTP(S) válidas')
    end

    def normalize_origin(value)
      self.class.normalize_origin(value)
    end
  end
end
