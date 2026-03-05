# frozen_string_literal: true

class CreateAnalyticsAnomaliesView < ActiveRecord::Migration[7.0]
  def up
    sql_file = Rails.root.join('db', 'views', 'analytics_anomalies_v01.sql')
    sql = File.read(sql_file)
    execute sql
  end
  
  def down
    execute "DROP VIEW IF EXISTS analytics_anomalies;"
  end
end
