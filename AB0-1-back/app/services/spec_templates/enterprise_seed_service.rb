module SpecTemplates
  class EnterpriseSeedService
    TEMPLATE_SETS = {
      "solar.painel" => [
        { key: "potencia_wp", label: "Potência Nominal", value_type: "integer", unit: "Wp", filterable: true, sortable: true, comparable: true, seo_weight: 10, required: true },
        { key: "eficiencia_pct", label: "Eficiência", value_type: "decimal", unit: "%", filterable: true, sortable: true, comparable: true, seo_weight: 9, required: true },
        { key: "tipo_celula", label: "Tipo de Célula", value_type: "enum", enum_values: %w[mono poli bifacial topcon hjt], filterable: true, sortable: false, comparable: false, seo_weight: 8 },
        { key: "tensao_vmp", label: "Tensão Vmp", value_type: "decimal", unit: "V", comparable: true, seo_weight: 5 },
        { key: "corrente_imp", label: "Corrente Imp", value_type: "decimal", unit: "A", comparable: true, seo_weight: 4 },
        { key: "temp_coef_pct", label: "Coeficiente de Temperatura", value_type: "decimal", unit: "%/°C", comparable: true, seo_weight: 6 },
        { key: "dimensoes_mm", label: "Dimensões", value_type: "string", seo_weight: 2 },
        { key: "peso_kg", label: "Peso", value_type: "decimal", unit: "kg", comparable: true, seo_weight: 3 },
        { key: "garantia_produto_anos", label: "Garantia do Produto", value_type: "integer", unit: "anos", filterable: true, sortable: true, seo_weight: 7 },
        { key: "garantia_performance_anos", label: "Garantia de Performance", value_type: "integer", unit: "anos", filterable: true, sortable: true, seo_weight: 7 },
        { key: "certificacoes", label: "Certificações", value_type: "string", filterable: true, seo_weight: 5 },
        { key: "ip_rating", label: "Proteção IP", value_type: "string", filterable: true, seo_weight: 4 },
        { key: "price", label: "Preço Médio", value_type: "decimal", unit: "BRL", sortable: true, comparable: true, seo_weight: 8 }
      ],
      "solar.inversor" => [
        { key: "potencia_kw", label: "Potência Nominal", value_type: "decimal", unit: "kW", filterable: true, sortable: true, comparable: true, seo_weight: 10, required: true },
        { key: "tipo", label: "Tipo", value_type: "enum", enum_values: %w[string micro hibrido central], filterable: true, seo_weight: 9 },
        { key: "mppt", label: "Quantidade de MPPT", value_type: "integer", filterable: true, sortable: true, comparable: true, seo_weight: 8 },
        { key: "eficiencia_pct", label: "Eficiência Máxima", value_type: "decimal", unit: "%", filterable: true, sortable: true, comparable: true, seo_weight: 8 },
        { key: "faixas_tensao_v", label: "Faixa de Tensão MPPT", value_type: "range", unit: "V", filterable: true, comparable: true, seo_weight: 7 },
        { key: "fases", label: "Fases", value_type: "enum", enum_values: %w[mono bi tri], filterable: true, seo_weight: 6 },
        { key: "wifi_monitoramento", label: "Monitoramento WiFi", value_type: "boolean", filterable: true },
        { key: "compat_bateria", label: "Compatível com Bateria", value_type: "boolean", filterable: true, seo_weight: 9 },
        { key: "ip_rating", label: "Proteção IP", value_type: "string", filterable: true },
        { key: "garantia_anos", label: "Garantia", value_type: "integer", unit: "anos", filterable: true, sortable: true, seo_weight: 7 },
        { key: "noise_db", label: "Nível de Ruído", value_type: "decimal", unit: "dB", comparable: true, seo_weight: 3 },
        { key: "price", label: "Preço Médio", value_type: "decimal", unit: "BRL", sortable: true, comparable: true, seo_weight: 8 }
      ],
      "solar.bateria" => [
        { key: "capacidade_kwh", label: "Capacidade Nominal", value_type: "decimal", unit: "kWh", filterable: true, sortable: true, comparable: true, seo_weight: 10, required: true },
        { key: "tecnologia", label: "Tecnologia", value_type: "enum", enum_values: %w[lfp nmc lto lead_acid], filterable: true, seo_weight: 9 },
        { key: "ciclos", label: "Ciclos de Vida", value_type: "integer", filterable: true, sortable: true, comparable: true, seo_weight: 8 },
        { key: "dod_pct", label: "Profundidade de Descarga", value_type: "decimal", unit: "%", filterable: true, comparable: true, seo_weight: 7 },
        { key: "potencia_saida_kw", label: "Potência de Saída", value_type: "decimal", unit: "kW", filterable: true, sortable: true, comparable: true, seo_weight: 8 },
        { key: "tensao_v", label: "Tensão Nominal", value_type: "decimal", unit: "V", filterable: true, comparable: true, seo_weight: 6 },
        { key: "modular_expansivel", label: "Expansível Modular", value_type: "boolean", filterable: true, seo_weight: 7 },
        { key: "garantia_anos", label: "Garantia", value_type: "integer", unit: "anos", filterable: true, sortable: true, seo_weight: 8 },
        { key: "peso_kg", label: "Peso", value_type: "decimal", unit: "kg", comparable: true, seo_weight: 3 },
        { key: "ip_rating", label: "Proteção IP", value_type: "string", filterable: true, seo_weight: 4 },
        { key: "price", label: "Preço Médio", value_type: "decimal", unit: "BRL", sortable: true, comparable: true, seo_weight: 9 }
      ],
      "ev.wallbox" => [
        { key: "potencia_kw", label: "Potência Máxima", value_type: "decimal", unit: "kW", filterable: true, sortable: true, comparable: true, seo_weight: 10, required: true },
        { key: "fases", label: "Fases", value_type: "enum", enum_values: %w[mono tri], filterable: true, seo_weight: 8 },
        { key: "conector_tipo", label: "Tipo de Conector", value_type: "enum", enum_values: %w[tipo1 tipo2 ccs1 ccs2 chademo], filterable: true, seo_weight: 9 },
        { key: "corrente_max_a", label: "Corrente Máxima", value_type: "integer", unit: "A", filterable: true, sortable: true, comparable: true, seo_weight: 8 },
        { key: "ocpp", label: "Compatível OCPP", value_type: "boolean", filterable: true, seo_weight: 9 },
        { key: "wifi", label: "Conexão WiFi", value_type: "boolean", filterable: true },
        { key: "app_mobile", label: "App Mobile", value_type: "boolean", filterable: true },
        { key: "balanceamento_carga", label: "Balanceamento Dinâmico de Carga", value_type: "boolean", filterable: true, seo_weight: 8 },
        { key: "rfid", label: "Leitor RFID", value_type: "boolean", filterable: true },
        { key: "ip_rating", label: "Proteção IP", value_type: "string", filterable: true },
        { key: "uso", label: "Aplicação Principal", value_type: "enum", enum_values: %w[residencial condominio comercial publico], filterable: true, seo_weight: 7 },
        { key: "garantia_anos", label: "Garantia", value_type: "integer", unit: "anos", filterable: true },
        { key: "price", label: "Preço Médio", value_type: "decimal", unit: "BRL", sortable: true, comparable: true, seo_weight: 9 }
      ],
      "ev.dc_rapido" => [
        { key: "potencia_kw", label: "Potência Máxima", value_type: "decimal", unit: "kW", filterable: true, sortable: true, comparable: true, seo_weight: 10, required: true },
        { key: "conectores", label: "Conectores Disponíveis", value_type: "string", filterable: true },
        { key: "tensao_v", label: "Faixa de Tensão", value_type: "range", unit: "V" },
        { key: "corrente_a", label: "Faixa de Corrente", value_type: "range", unit: "A" },
        { key: "refrigeracao", label: "Tipo de Refrigeração", value_type: "enum", enum_values: %w[ar liquido], filterable: true },
        { key: "pagamento_integrado", label: "Pagamento Integrado", value_type: "boolean", filterable: true },
        { key: "ocpp", label: "Compatível OCPP", value_type: "boolean", filterable: true, seo_weight: 9 },
        { key: "uso", label: "Aplicação Principal", value_type: "enum", enum_values: %w[rodovia urbano shopping posto fleet], filterable: true, seo_weight: 8 },
        { key: "peso_kg", label: "Peso", value_type: "decimal", unit: "kg" },
        { key: "garantia_anos", label: "Garantia", value_type: "integer", unit: "anos" },
        { key: "price", label: "Preço Médio", value_type: "decimal", unit: "BRL", sortable: true, comparable: true, seo_weight: 9 }
      ],
      "ev.ocpp_software" => [
        { key: "ocpp_version", label: "Versão OCPP Suportada", value_type: "enum", enum_values: %w[1.6 2.0.1 2.1], filterable: true, seo_weight: 10 },
        { key: "billing", label: "Cobrança Integrada", value_type: "boolean", filterable: true },
        { key: "multi_site", label: "Gestão Multi-Site", value_type: "boolean", filterable: true },
        { key: "rbac", label: "Controle de Acesso (RBAC)", value_type: "boolean", filterable: true },
        { key: "white_label", label: "White Label", value_type: "boolean", filterable: true },
        { key: "api", label: "API Pública/REST", value_type: "boolean", filterable: true },
        { key: "integrations", label: "Integrações Nativas", value_type: "string" },
        { key: "price_model", label: "Modelo de Preço", value_type: "enum", enum_values: %w[mensal por_transacao hibrido freemium], filterable: true }
      ]
    }.freeze

    def self.call
      new.call
    end

    def call
      TEMPLATE_SETS.each do |product_type, specs|
        specs.each do |attrs|
          upsert_template(product_type, attrs)
        end
      end
    end

    private

    def upsert_template(product_type, attrs)
      template = SpecTemplate.find_or_initialize_by(product_type: product_type, key: attrs[:key])
      template.assign_attributes(
        label: attrs[:label],
        value_type: attrs[:value_type],
        unit: attrs[:unit],
        enum_values: attrs[:enum_values] || [],
        filterable: attrs.fetch(:filterable, false),
        sortable: attrs.fetch(:sortable, false),
        comparable: attrs.fetch(:comparable, false),
        seo_weight: attrs.fetch(:seo_weight, 0),
        required: attrs.fetch(:required, false)
      )
      template.save!
    rescue => e
      Rails.logger.error("[SpecTemplates::EnterpriseSeedService] Failed to upsert #{product_type}:#{attrs[:key]} - #{e.message}")
    end
  end
end
