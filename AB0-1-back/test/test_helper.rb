# TASK-012: SimpleCov configuration
# Deve ser carregado ANTES de qualquer outro código da aplicação
if ENV['COVERAGE'] || ENV['CI']
  require 'simplecov'
  require 'simplecov-console'

  SimpleCov.start 'rails' do
    # Formatter para console e HTML
    if ENV['CI']
      formatter SimpleCov::Formatter::SimpleFormatter
    else
      SimpleCov.formatters = [
        SimpleCov::Formatter::HTMLFormatter,
        SimpleCov::Formatter::Console
      ]
    end

    # Diretórios para incluir na cobertura
    add_group 'Controllers', 'app/controllers'
    add_group 'Models', 'app/models'
    add_group 'Serializers', 'app/serializers'
    add_group 'Services', 'app/services'
    add_group 'Jobs', 'app/jobs'
    add_group 'Mailers', 'app/mailers'
    add_group 'Helpers', 'app/helpers'
    add_group 'Validators', 'app/validators'

    # Diretórios para excluir da cobertura
    add_filter '/test/'
    add_filter '/config/'
    add_filter '/vendor/'
    add_filter '/spec/'
    add_filter 'app/admin' # ActiveAdmin gerado automaticamente
    add_filter 'app/channels' # Não usado ainda

    # Minimum coverage threshold
    # minimum_coverage 80 # Descomente quando atingir 80%
    # minimum_coverage_by_file 70

    # Configurações de tracking
    track_files '{app,lib}/**/*.rb'
    
    # Merge resultados de múltiplos runs
    merge_timeout 3600 # 1 hora
  end

  SimpleCov::Formatter::Console.show_covered = true
  SimpleCov::Formatter::Console.output_style = 'block'

  puts "\n🔍 SimpleCov enabled - Coverage report will be generated\n\n"
end

ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'

class ActiveSupport::TestCase
  # Run tests in parallel with specified workers
  parallelize(workers: :number_of_processors)

  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  # Add more helper methods to be used by all tests here...
end
