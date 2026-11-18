# frozen_string_literal: true

require 'yaml'

module Seeds
  class AchievementsSeed
    def self.run!
      puts "\n==> Semeando Conquistas e Badges de Avaliadores (G2 Inspired)"
      yaml_path = Rails.root.join('db', 'seeds', 'achievements.yml')
      unless File.exist?(yaml_path)
        puts "  • Arquivo #{yaml_path} não encontrado. Pulando."
        return
      end

      achievements_data = YAML.load_file(yaml_path)
      count = 0

      achievements_data.each do |data|
        badge = AchievementBadge.find_or_initialize_by(slug: data['slug'])
        badge.assign_attributes(
          name: data['name'],
          description: data['description'],
          category: data['category'],
          tier: data['tier'],
          points_xp: data['points_xp'],
          metric_key: data['metric_key'],
          threshold: data['threshold'],
          action_enum: data['action_enum'],
          earned_asset_path: data['earned_asset_path'],
          locked_asset_path: data['locked_asset_path'],
          position: data['position'],
          active: data['active'],
          revocable: data['revocable']
        )
        badge.save!
        count += 1
      end

      puts "  ✓ #{count} conquistas de avaliadores semeadas com sucesso!"
    end
  end
end
