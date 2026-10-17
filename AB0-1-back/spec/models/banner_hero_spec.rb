require 'rails_helper'

RSpec.describe Banner, type: :model do
  describe 'BannerPlacements::Catalog home_hero' do
    it 'includes home_hero with expected dimensions' do
      expect(BannerPlacements::Catalog.keys).to include('home_hero')
      entry = BannerPlacements::Catalog.fetch('home_hero')
      expect(entry.dimensions).to eq([1330, 230])
      expect(entry.status).to eq('active')
    end

    it 'assigns default dimensions for home_hero when creating a banner without dimensions' do
      banner = Banner.new(
        title: 'Hero Campaign Test',
        banner_type: 'rectangular_large',
        position: 'home_hero'
      )
      banner.valid?
      expect(banner.width).to eq(1330)
      expect(banner.height).to eq(230)
    end
  end

  describe 'Hero Campaign Validations' do
    let(:banner) do
      Banner.new(
        title: 'Campanha Solar 2026',
        banner_type: 'rectangular_large',
        position: 'home_hero',
        width: 1330,
        height: 230
      )
    end

    it 'validates headline maximum length of 110 characters' do
      banner.headline = 'A' * 111
      expect(banner).not_to be_valid
      expect(banner.errors[:headline]).to be_present

      banner.headline = 'A' * 110
      banner.valid?
      expect(banner.errors[:headline]).to be_empty
    end

    it 'validates subtitle maximum length of 180 characters' do
      banner.subtitle = 'B' * 181
      expect(banner).not_to be_valid
      expect(banner.errors[:subtitle]).to be_present

      banner.subtitle = 'B' * 180
      banner.valid?
      expect(banner.errors[:subtitle]).to be_empty
    end

    it 'validates cta_label maximum length of 36 characters' do
      banner.cta_label = 'C' * 37
      expect(banner).not_to be_valid
      expect(banner.errors[:cta_label]).to be_present

      banner.cta_label = 'C' * 36
      banner.valid?
      expect(banner.errors[:cta_label]).to be_empty
    end

    it 'validates hex colors format (#RRGGBB)' do
      banner.hero_background_color = 'invalid-hex'
      expect(banner).not_to be_valid
      expect(banner.errors[:hero_background_color]).to be_present

      banner.hero_background_color = '#0B132B'
      banner.valid?
      expect(banner.errors[:hero_background_color]).to be_empty
    end

    it 'validates theme inclusion' do
      banner.theme = 'neon'
      expect(banner).not_to be_valid
      expect(banner.errors[:theme]).to be_present

      banner.theme = 'dark'
      banner.valid?
      expect(banner.errors[:theme]).to be_empty
    end

    it 'validates cta_variant inclusion' do
      banner.cta_variant = 'rainbow'
      expect(banner).not_to be_valid
      expect(banner.errors[:cta_variant]).to be_present

      banner.cta_variant = 'solar_yellow'
      banner.valid?
      expect(banner.errors[:cta_variant]).to be_empty
    end

    it 'validates overlay_variant inclusion' do
      banner.overlay_variant = 'heavy_blur'
      expect(banner).not_to be_valid
      expect(banner.errors[:overlay_variant]).to be_present

      banner.overlay_variant = 'left_soft'
      banner.valid?
      expect(banner.errors[:overlay_variant]).to be_empty
    end

    it 'validates creative_mode inclusion' do
      banner.creative_mode = 'flash_animation'
      expect(banner).not_to be_valid
      expect(banner.errors[:creative_mode]).to be_present

      banner.creative_mode = 'photo_with_html'
      banner.valid?
      expect(banner.errors[:creative_mode]).to be_empty
    end

    it 'validates object positions between 0 and 100' do
      banner.object_position_desktop_x = 105
      expect(banner).not_to be_valid
      expect(banner.errors[:object_position_desktop_x]).to be_present

      banner.object_position_desktop_x = 50
      banner.valid?
      expect(banner.errors[:object_position_desktop_x]).to be_empty
    end

    it 'validates cta_href allows relative internal paths' do
      banner.cta_href = '/empresas/sol-brasil'
      banner.valid?
      expect(banner.errors[:cta_href]).to be_empty
    end

    it 'validates cta_href allows absolute https URLs' do
      banner.cta_href = 'https://avaliasolar.com.br/planos'
      banner.valid?
      expect(banner.errors[:cta_href]).to be_empty
    end

    it 'rejects unsafe cta_href URLs (javascript: or protocol-relative)' do
      banner.cta_href = 'javascript:alert(1)'
      expect(banner).not_to be_valid
      expect(banner.errors[:cta_href]).to be_present

      banner.cta_href = '//evil.com'
      expect(banner).not_to be_valid
      expect(banner.errors[:cta_href]).to be_present
    end
  end
end
