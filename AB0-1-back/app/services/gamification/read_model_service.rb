# frozen_string_literal: true

module Gamification
  class ReadModelService
    SCHEMA_VERSION = '2026-11-v1'

    FAQ_ITEMS = [
      {
        question: 'Quem é elegível para o programa de conquistas?',
        answer: 'Todos os membros e avaliadores cadastrados na comunidade Avalia Solar que contribuem ' \
                'com avaliações sinceras, enriquecem seus perfis e cadastram seus equipamentos ' \
                'participam automaticamente.'
      },
      {
        question: 'Onde vejo e compartilho meus selos?',
        answer: 'Seus selos ficam visíveis nesta aba de Conquistas da Central do Avaliador. ' \
                'Ao desbloquear um selo, você pode compartilhá-lo diretamente no LinkedIn ou ' \
                'através do link oficial de verificação.'
      },
      {
        question: 'Posso trocar selos por dinheiro ou brindes?',
        answer: 'Não. As conquistas do Avalia Solar têm caráter estritamente de reconhecimento, ' \
                'reputação e transparência comunitária, sem valor monetário ou resgate financeiro.'
      },
      {
        question: 'Enviei uma avaliação, por que ainda não recebi meu selo?',
        answer: 'Para garantir a credibilidade da plataforma, todas as avaliações passam por moderação ' \
                'humana antifraude. Assim que a avaliação for aprovada pela moderação, o selo ' \
                'correspondente será liberado automaticamente.'
      }
    ].freeze

    def initialize(user:, base_url: nil, request_id: nil)
      @user = user
      @base_url = (base_url.presence || ENV['APP_HOST'] || 'https://avaliasolar.com.br').sub(%r{/+$}, '')
      @request_id = request_id
    end

    def call
      user_achievements_by_badge_id = @user.user_achievements.index_by(&:achievement_badge_id)
      badges = AchievementBadge.active.ordered

      achievements = badges.map do |badge|
        serialize_achievement(badge, user_achievements_by_badge_id[badge.id])
      end

      {
        schema_version: SCHEMA_VERSION,
        summary: build_summary(achievements),
        achievements: achievements,
        faq: FAQ_ITEMS
      }
    end

    private

    def build_summary(achievements)
      unlocked_count = achievements.count { |a| a[:state] == 'unlocked' }
      total_count = achievements.size
      xp_total = @user.total_achievement_xp
      completion_pct = total_count.positive? ? ((unlocked_count.to_f / total_count) * 100).round : 0

      {
        unlocked_count: unlocked_count,
        total_count: total_count,
        xp_total: xp_total,
        completion_percentage: completion_pct,
        next_suggested: find_next_suggested(achievements)
      }
    end

    def find_next_suggested(achievements)
      achievements.find { |a| a[:state] == 'in_progress' } ||
        achievements.find { |a| a[:state] == 'locked' }
    end

    def serialize_achievement(badge, user_achievement)
      rule = Gamification::Rules::Registry.for(badge)
      state, progress = resolve_state_and_progress(badge, user_achievement, rule)
      unlocked = user_achievement&.unlocked? || false

      build_achievement_item(badge, user_achievement, state, progress, unlocked)
    end

    def build_achievement_item(badge, user_achievement, state, progress, unlocked)
      {
        id: badge.slug, name: badge.name, title: badge.name,
        description: badge.description, subtitle: badge.description,
        category: badge.category, tier: badge.tier, state: state,
        unlocked: unlocked, progress: progress,
        threshold: badge.threshold, target: badge.threshold,
        points: badge.points_xp, xp: unlocked ? badge.points_xp : 0,
        unlocked_at: unlocked ? user_achievement&.unlocked_at&.iso8601 : nil,
        asset: { earned: public_asset_path(badge.earned_asset_path), locked: public_asset_path(badge.locked_asset_path) },
        action: badge.action_enum,
        share: build_share_data(unlocked, user_achievement)
      }
    end

    def public_asset_path(path)
      "/assets/achievements/#{path.to_s.delete_prefix('/').delete_prefix('assets/achievements/')}"
    end

    def resolve_state_and_progress(badge, user_achievement, rule)
      if user_achievement&.unlocked?
        ['unlocked', badge.threshold]
      elsif user_achievement&.revoked?
        ['revoked', 0]
      else
        progress = rule ? rule.progress(@user) : 0
        [progress.positive? ? 'in_progress' : 'locked', progress]
      end
    end

    def build_share_data(unlocked, user_achievement)
      return nil unless unlocked && user_achievement&.share_token.present?

      {
        verify_url: "#{@base_url}/conquistas/verificar/#{user_achievement.share_token}",
        token: user_achievement.share_token
      }
    end
  end
end
