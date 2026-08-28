namespace :entitlements do
  desc "Sincroniza materiais de download em planos Pro; use DRY_RUN=false"
  task sync_pro_downloadable_materials: :environment do
    dry_run = ENV.fetch("DRY_RUN", "true") != "false"
    plans = Plan.all.select { |plan| plan.plan_tier.to_s == "pro" }
    changed = 0
    plans.each do |plan|
      features = plan.feature_flags.stringify_keys
      next if features["downloadable_materials"] == true
      changed += 1
      next if dry_run
      features["downloadable_materials"] = true
      plan.update!(features_json: features, features: features.to_json)
    end
    puts "entitlements: pro=#{plans.size} eligible=#{changed} corrected=#{dry_run ? 0 : changed} dry_run=#{dry_run}"
  end
end
