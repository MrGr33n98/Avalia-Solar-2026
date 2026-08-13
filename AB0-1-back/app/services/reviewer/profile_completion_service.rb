# frozen_string_literal: true

module Reviewer
  class ProfileCompletionService
    ITEMS = [
      ['name', 'Nome'],
      ['email', 'E-mail'],
      ['city', 'Cidade'],
      ['state', 'Estado'],
      ['avatar', 'Foto de perfil'],
      ['profession', 'Profissão']
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
      return @user.avatar.attached? if key == 'avatar'
      value = key == 'profession' ? @user.reviewer_profile&.profession : @user.public_send(key)
      value.present?
    end
  end
end
