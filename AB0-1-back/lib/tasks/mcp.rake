# frozen_string_literal: true

namespace :mcp do
  namespace :oauth do
    desc 'Registra ou atualiza um cliente OAuth Doorkeeper para integrações MCP (ChatGPT, Claude Desktop, SDKs)'
    task :register, %i[name redirect_uri scopes confidential] => :environment do |_t, args|
      name = args[:name].presence || 'ChatGPT Avalia Solar MCP'
      scopes = args[:scopes].presence || 'mcp:public:read'
      confidential = args[:confidential].to_s == 'true'

      default_uris = [
        'https://chatgpt.com/connector/oauth/iwgnUmlxR3DA',
        'https://chatgpt.com/connector/oauth',
        'https://chat.openai.com/aip/plugin-mcp/oauth/callback'
      ]
      raw_uri = args[:redirect_uri].presence
      redirect_uris = if raw_uri.present?
                        raw_uri.split(/[\s,]+/).reject(&:blank?)
                      else
                        default_uris
                      end

      app = Doorkeeper::Application.find_or_initialize_by(name: name)
      app.redirect_uri = redirect_uris.join("\n")
      app.scopes = scopes
      app.confidential = confidential
      app.save!

      puts '=================================================='
      puts 'Cliente OAuth MCP cadastrado com sucesso!'
      puts "Nome:         #{app.name}"
      puts "Client ID:    #{app.uid}"
      puts "Redirect URI: #{app.redirect_uri}"
      puts "Scopes:       #{app.scopes}"
      puts "Confidencial: #{app.confidential}"
      puts '=================================================='
      puts 'Para autorizar no Canary de Staging/Producao, adicione ao env:'
      puts "MCP_CANARY_ALLOWED_CLIENT_IDS=#{app.uid}"
      puts '=================================================='
    end

    desc 'Lista clientes OAuth Doorkeeper registrados para MCP'
    task list: :environment do
      puts '=================================================='
      puts 'Clientes OAuth Doorkeeper Registrados:'
      puts '=================================================='
      Doorkeeper::Application.find_each do |app|
        puts "- #{app.name} (ID: #{app.id})"
        puts "  Client ID (UID): #{app.uid}"
        puts "  Redirect URI:    #{app.redirect_uri}"
        puts "  Scopes:          #{app.scopes}"
        puts "  Confidential:    #{app.confidential}"
        puts '--------------------------------------------------'
      end
    end
  end

  namespace :canary do
    desc 'Verifica o status e configuracao do MCP Canary Guard no ambiente atual'
    task status: :environment do
      config = Mcp::Canary::Configuration
      puts '=================================================='
      puts 'MCP Canary Guard Status:'
      puts '=================================================='
      puts "Enforced:           #{config.enforced?}"
      puts "Enabled:            #{config.enabled?}"
      puts "Configured:         #{config.configured?}"
      puts "Profile:            #{config.profile}"
      puts "Phase:              #{config.phase}"
      puts "Discovery Enabled:  #{config.discovery_enabled?}"
      puts "Execution Enabled:  #{config.execution_enabled?}"
      puts "Canonical Resource: #{config.canonical_resource}"
      puts "Canonical Issuer:   #{config.canonical_issuer}"
      puts "Allowed Clients:    #{config.allowlisted_client_ids.inspect}"
      puts "Allowed Subjects:   #{config.allowlisted_subjects.inspect}"
      puts '=================================================='
    end
  end
end
