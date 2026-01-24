class BannerGlobal < ApplicationRecord
  has_one_attached :image

  validates :title, presence: true
  validates :link, presence: true

  # === Callbacks de Cache (Fase 1) ===
  after_save :invalidate_cache
  after_destroy :invalidate_cache

  def self.ransackable_attributes(_auth_object = nil)
    %w[title link created_at id]
  end

  def self.ransackable_associations(_auth_object = nil)
    %w[image_attachment image_blob]
  end

  private

  # Invalida cache quando banner global é alterado
  def invalidate_cache
    Rails.cache.delete_matched('banner_globals/v1/*')
    Rails.logger.info("[BannerGlobal##{id}] Cache invalidado após alteração")
  rescue StandardError => e
    Rails.logger.error("[BannerGlobal##{id}] Erro ao invalidar cache: #{e.message}")
  end
end
