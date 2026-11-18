# frozen_string_literal: true

namespace :gamification do
  desc 'Reavalia todas as conquistas para os usuários (suporta dry_run=true)'
  task :evaluate_all, [:dry_run] => :environment do |_t, args|
    dry_run = args[:dry_run].to_s.downcase == 'true' || ENV['DRY_RUN'].to_s.downcase == 'true'

    Rails.logger.info("[Gamification] Iniciando backfill de conquistas (dry_run: #{dry_run})")
    puts '=========================================================='
    puts " Iniciando Gamification Backfill (dry_run: #{dry_run}) "
    puts '=========================================================='

    total_users = User.count
    processed = 0
    total_unlocked = 0
    total_revoked = 0
    total_reinstated = 0

    User.find_each(batch_size: 500) do |user|
      if dry_run
        AchievementBadge.active.ordered.each do |badge|
          rule = Gamification::Rules::Registry.for(badge)
          next unless rule

          eligible, = rule.evaluate(user)
          already_unlocked = user.user_achievements.exists?(achievement_badge_id: badge.id, state: 'unlocked')

          if eligible && !already_unlocked
            total_unlocked += 1
          elsif !eligible && already_unlocked && badge.revocable?
            total_revoked += 1
          end
        end
      else
        result = Gamification::EvaluateAchievementsService.call(
          user_id: user.id,
          trigger_cause: 'rake_backfill'
        )

        if result.success?
          total_unlocked += result.unlocked_badges.size
          total_revoked += result.revoked_badges.size
          total_reinstated += result.reinstated_badges.size
        else
          puts "[ERRO] Usuário #{user.id}: #{result.error}"
        end
      end

      processed += 1
      print '.' if (processed % 100).zero?
    end

    puts "\n=========================================================="
    puts ' Backfill concluído!'
    puts " Usuários processados: #{processed}/#{total_users}"
    puts " Conquistas desbloqueadas: #{total_unlocked}"
    puts " Conquistas revogadas:     #{total_revoked}"
    puts " Conquistas reintegradas: #{total_reinstated}"
    puts '=========================================================='
  end
end
