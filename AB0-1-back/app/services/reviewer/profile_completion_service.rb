# frozen_string_literal: true

module Reviewer
  class ProfileCompletionService
    ITEMS = [
      ['name', 'Nome'],
      ['email', 'E-mail'],
      ['city', 'Cidade'],
      ['state', 'Estado'],
      ['avatar', 'Foto de perfil'],
      ['profession', 'Profissão'],
      ['bio', 'Sobre você'],
      ['social', 'Redes sociais'],
      ['solutions', 'Soluções que usa'],
      ['review', 'Primeira avaliação']
    ].freeze

    def initialize(user:)
      @user = user
    end

    def call
      items = ITEMS.map { |key, label| { key: key, label: label, completed: completed?(key) } }
      { percent: ((items.count { |item| item[:completed] }.fdiv(items.length)) * 100).round, items: items,
        missing_fields: items.reject { |item| item[:completed] }.map { |item| item[:key] } }
    end

    private

    def completed?(key)
      return @user.avatar.attached? || @user.avatar_url.present? if key == 'avatar'
      return @user.reviewer_profile&.profession.present? if key == 'profession'
      return @user.reviewer_profile&.bio.present? if key == 'bio'
      return %w[linkedin_url instagram_url website_url whatsapp_url].any? { |field| @user.reviewer_profile&.public_send(field).present? } if key == 'social'
      return @user.reviewer_solutions.exists? if key == 'solutions'
      return @user.reviews.exists? if key == 'review'

      @user.public_send(key).present?
    end
  end
end
