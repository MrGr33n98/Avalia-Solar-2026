# frozen_string_literal: true

namespace :ranking_snapshots do
  desc 'Relata integridade e frescor dos snapshots de ranking sem alterar dados'
  task preflight: :environment do
    relation = CompanyRankingSnapshot.all
    daily_key = if CompanyRankingSnapshot.column_names.include?('snapshot_date')
                  :snapshot_date
                else
                  "DATE(computed_at AT TIME ZONE 'America/Sao_Paulo')"
                end
    duplicates = relation.group(:company_id, :scope_type, :scope_id, :definition_version, daily_key)
                         .having('COUNT(*) > 1').count
    latest_snapshot = relation.order(computed_at: :desc).first

    puts "Snapshots: #{relation.count}"
    puts "Chaves diárias duplicadas: #{duplicates.size}"
    puts "Último computed_at: #{latest_snapshot&.computed_at || 'ausente'}"
    puts "Último data_through: #{latest_snapshot&.data_through || 'ausente'}"
    duplicates.first(20).each do |key, count|
      company_id, scope_type, scope_id, version, snapshot_date = key
      puts "Duplicata: empresa=#{company_id} escopo=#{scope_type}/#{scope_id || 'global'} versão=#{version} data=#{snapshot_date} total=#{count}"
    end

    abort('Preflight falhou: corrija duplicatas antes da migration de unicidade.') if duplicates.any?
  end
end
