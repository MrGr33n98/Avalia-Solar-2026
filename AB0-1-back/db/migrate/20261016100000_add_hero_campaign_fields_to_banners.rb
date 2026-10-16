class AddHeroCampaignFieldsToBanners < ActiveRecord::Migration[7.0]
  def change
    add_column :banners, :headline, :string, limit: 110
    add_column :banners, :subtitle, :text
    add_column :banners, :cta_label, :string, limit: 36
    add_column :banners, :cta_href, :string, limit: 2048
    add_column :banners, :cta_enabled, :boolean, default: true, null: false
    add_column :banners, :theme, :string, default: 'dark', null: false
    add_column :banners, :cta_variant, :string, default: 'solar_yellow', null: false
    add_column :banners, :hero_background_color, :string, limit: 7
    add_column :banners, :hero_text_color, :string, limit: 7
    add_column :banners, :cta_background_color, :string, limit: 7
    add_column :banners, :cta_text_color, :string, limit: 7
    add_column :banners, :overlay_variant, :string, default: 'left_soft', null: false
    add_column :banners, :creative_mode, :string, default: 'photo_with_html', null: false
    add_column :banners, :object_position_desktop_x, :integer, default: 50, null: false
    add_column :banners, :object_position_desktop_y, :integer, default: 50, null: false
    add_column :banners, :object_position_mobile_x, :integer, default: 50, null: false
    add_column :banners, :object_position_mobile_y, :integer, default: 50, null: false
    add_column :banners, :whole_banner_clickable, :boolean, default: false, null: false
    add_column :banners, :creative_version, :integer, default: 1, null: false
  end
end
