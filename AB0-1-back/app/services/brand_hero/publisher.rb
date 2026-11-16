# frozen_string_literal: true

module BrandHero
  class Publisher
    class InvalidPublication < StandardError; end
    ASPECT_TOLERANCE = 0.01

    def self.call(slide:, reviewer_id: nil)
      company = slide.company
      company.with_lock do
        raise InvalidPublication, 'O plano atual não permite o carrossel' unless Eligibility.allowed?(company)

        slide.reload
        unless %w[pending_review approved].include?(slide.status)
          raise InvalidPublication, 'A revisão precisa estar em análise ou aprovada'
        end
        raise InvalidPublication, 'Imagem inválida ou sem dimensões verificadas' unless slide.ready_for_publication?

        others = company.company_hero_slides.where(status: 'published')
                        .where.not(slot: slide.slot).to_a
        raise InvalidPublication, 'Limite de 3 imagens' if others.size >= 3

        # Preserve a stable hero frame: no crop, letterbox, or height jumps.
        unless others.all? { |current| compatible_ratio?(slide, current) }
          raise InvalidPublication, 'As imagens precisam ter proporção compatível (até 1%)'
        end

        prior = company.company_hero_slides.find_by(slot: slide.slot, status: 'published')
        prior&.update!(status: 'archived', archived_at: Time.current)
        slide.update!(
          status: 'published', reviewed_by_id: reviewer_id,
          approved_at: Time.current, published_at: Time.current,
          rejected_reason: nil
        )
      end
      slide
    end

    def self.compatible_ratio?(a, b)
      return false unless a.aspect_ratio && b.aspect_ratio

      ((a.aspect_ratio - b.aspect_ratio).abs / b.aspect_ratio) <= ASPECT_TOLERANCE
    end
  end
end
