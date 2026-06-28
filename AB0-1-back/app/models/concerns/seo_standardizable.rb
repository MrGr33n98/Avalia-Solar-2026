# frozen_string_literal: true

module SeoStandardizable
  extend ActiveSupport::Concern

  included do
    before_validation :standardize_seo_metadata
  end

  # Configurações padrão
  SEO_TITLE_MIN = 30
  SEO_TITLE_MAX = 60
  SEO_DESC_MIN = 70
  SEO_DESC_MAX = 160
  BRAND_SUFFIX = ' | Avalia Solar'

  def display_seo_title
    raw_title = try(:seo_title).presence || try(:meta_title).presence || try(:name).presence || try(:title).presence
    standardize_text(raw_title, SEO_TITLE_MIN, SEO_TITLE_MAX, true)
  end

  def display_seo_description
    raw_desc = try(:meta_description).presence || try(:short_description).presence || try(:description).presence || try(:excerpt).presence
    standardize_text(raw_desc, SEO_DESC_MIN, SEO_DESC_MAX, false)
  end

  private

  def standardize_seo_metadata
    # Atualiza os campos persistidos se existirem
    if respond_to?(:seo_title=) && seo_title.present?
      self.seo_title = standardize_text(seo_title, SEO_TITLE_MIN, SEO_TITLE_MAX, true)
    elsif respond_to?(:meta_title=) && meta_title.present?
      self.meta_title = standardize_text(meta_title, SEO_TITLE_MIN, SEO_TITLE_MAX, true)
    end

    if respond_to?(:meta_description=) && meta_description.present?
      self.meta_description = standardize_text(meta_description, SEO_DESC_MIN, SEO_DESC_MAX, false)
    elsif respond_to?(:short_description=) && short_description.present?
      self.short_description = standardize_text(short_description, SEO_DESC_MIN, SEO_DESC_MAX, false)
    end
  end

  def standardize_text(text, min, max, is_title)
    return '' if text.blank?

    # Remove tags HTML e espaços extras
    clean_text = ActionView::Base.full_sanitizer.sanitize(text).squish

    if clean_text.length > max
      # Truncamento inteligente (não corta palavras ao meio)
      clean_text = clean_text.truncate(max - 3, separator: ' ', omission: '...')
    elsif clean_text.length < min && is_title
      # Expansão de títulos curtos com a marca
      suffix = BRAND_SUFFIX
      clean_text = "#{clean_text}#{suffix}" if (clean_text + suffix).length <= max
    end

    clean_text
  end
end
