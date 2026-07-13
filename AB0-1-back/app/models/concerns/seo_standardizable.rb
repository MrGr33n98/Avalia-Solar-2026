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
    raw_desc = try(:seo_description).presence || try(:meta_description).presence || try(:short_description).presence || try(:description).presence || try(:excerpt).presence
    standardize_text(raw_desc, SEO_DESC_MIN, SEO_DESC_MAX, false)
  end

  private

  def standardize_seo_metadata
    title_cleared =
      (respond_to?(:will_save_change_to_seo_title?) && will_save_change_to_seo_title? && try(:seo_title).blank?) ||
      (respond_to?(:will_save_change_to_meta_title?) && will_save_change_to_meta_title? && try(:meta_title).blank?)

    if title_cleared
      self.seo_title = nil if respond_to?(:seo_title=)
      self.meta_title = nil if respond_to?(:meta_title=)
    else
      title_source =
        if respond_to?(:seo_title) && seo_title.present?
          seo_title
        elsif respond_to?(:meta_title) && meta_title.present?
          meta_title
        end

      if title_source.present?
        standardized_title = standardize_text(title_source, SEO_TITLE_MIN, SEO_TITLE_MAX, true)
        self.seo_title = standardized_title if respond_to?(:seo_title=)
        self.meta_title = standardized_title if respond_to?(:meta_title=)
      end
    end

    description_cleared =
      (respond_to?(:will_save_change_to_seo_description?) && will_save_change_to_seo_description? && try(:seo_description).blank?) ||
      (respond_to?(:will_save_change_to_meta_description?) && will_save_change_to_meta_description? && try(:meta_description).blank?)

    if description_cleared
      self.seo_description = nil if respond_to?(:seo_description=)
      self.meta_description = nil if respond_to?(:meta_description=)
    else
      description_source =
        if respond_to?(:seo_description) && seo_description.present?
          seo_description
        elsif respond_to?(:meta_description) && meta_description.present?
          meta_description
        end

      if description_source.present?
        standardized_description = standardize_text(description_source, SEO_DESC_MIN, SEO_DESC_MAX, false)
        self.seo_description = standardized_description if respond_to?(:seo_description=)
        self.meta_description = standardized_description if respond_to?(:meta_description=)
      elsif respond_to?(:short_description=) && short_description.present?
        self.short_description = standardize_text(short_description, SEO_DESC_MIN, SEO_DESC_MAX, false)
      end
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
