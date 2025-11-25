# Script para inserir migração manualmente
require_relative 'config/environment'

ActiveRecord::Base.connection.execute("INSERT INTO schema_migrations (version) VALUES ('20250930041826')")
puts "Migration 20250930041826 inserida com sucesso!"