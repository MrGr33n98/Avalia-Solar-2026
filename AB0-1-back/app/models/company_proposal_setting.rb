# frozen_string_literal: true

class CompanyProposalSetting < ApplicationRecord
  belongs_to :company

  DEFAULT_PDF_COLORS = {
    'primary' => '#0066FF',
    'secondary' => '#0F172A',
    'accent' => '#F6E85A'
  }.freeze

  DEFAULT_SECTIONS = [
    { 'id' => '1', 'key' => 'sobre_empresa', 'label' => 'Sobre a empresa', 'enabled' => true, 'content' => '' },
    { 'id' => '2', 'key' => 'imagem_obras', 'label' => 'Imagens de obras', 'enabled' => true, 'content' => '' },
    { 'id' => '3', 'key' => 'titulo', 'label' => 'Título', 'enabled' => false, 'content' => 'Proposta Comercial de Energia Solar' },
    { 'id' => '4', 'key' => 'garantias', 'label' => 'Garantias', 'enabled' => false, 'content' => '' },
    { 'id' => '5', 'key' => 'termos_condicoes', 'label' => 'Termos e Condições', 'enabled' => true, 'content' => '' },
    { 'id' => '6', 'key' => 'cronograma', 'label' => 'Cronograma', 'enabled' => true, 'content' => '' }
  ].freeze

  DEFAULT_PAYMENT_CONDITIONS = [
    { 'id' => 'boleto', 'name' => 'Boleto bancário', 'enabled' => true, 'installments' => 1, 'discountPercent' => 5 },
    { 'id' => 'pix', 'name' => 'PIX / Transferência', 'enabled' => true, 'installments' => 1, 'discountPercent' => 5 },
    { 'id' => 'cartao', 'name' => 'Cartão de crédito', 'enabled' => false, 'installments' => 12, 'discountPercent' => 0 },
    { 'id' => 'financiamento', 'name' => 'Financiamento bancário solar', 'enabled' => false, 'installments' => 72, 'hasInfo' => true }
  ].freeze

  DEFAULT_DIGITAL_SECTIONS = [
    { 'id' => 'd1', 'key' => 'cronograma', 'label' => 'Cronograma', 'enabled' => false },
    { 'id' => 'd2', 'key' => 'imagens_obras', 'label' => 'Imagens de obras', 'enabled' => false },
    { 'id' => 'd3', 'key' => 'imagem_capa', 'label' => 'Imagem de capa', 'enabled' => false }
  ].freeze

  validates :company_id, presence: true, uniqueness: true
  validates :default_model, inclusion: { in: %w[modelo_1 modelo_2 modelo_3 essencial executivo tecnico] }

  after_initialize :set_defaults, if: :new_record?

  def set_defaults
    self.default_model ||= 'modelo_1'
    self.pdf_colors = DEFAULT_PDF_COLORS.merge(pdf_colors || {})
    self.cover_mode ||= 'solar_ceu'
    self.sections_config = DEFAULT_SECTIONS if sections_config.blank?
    self.pricing_tiers ||= []
    self.payment_conditions = DEFAULT_PAYMENT_CONDITIONS if payment_conditions.blank?
    self.digital_sections = DEFAULT_DIGITAL_SECTIONS if digital_sections.blank?
    self.custom_form_fields ||= []
  end

  def as_payload
    {
      company_id: company_id,
      selected_model: default_model,
      pdf_colors: pdf_colors,
      cover_mode: cover_mode,
      cover_image_url: cover_image_url,
      pdf_sections: sections_config,
      pricing_tiers: pricing_tiers,
      payment_conditions: payment_conditions,
      digital_sections: digital_sections,
      custom_form_fields: custom_form_fields,
      updated_at: updated_at&.iso8601
    }
  end
end
