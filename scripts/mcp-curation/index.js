#!/usr/bin/env node
/**
 * Avalia Solar - Curation & SEO MCP Server
 *
 * Servidor MCP autônomo (JSON-RPC 2.0 via stdio) para:
 * - Curadoria de instaladores solares em nível A+++
 * - Geração de metadados de SEO, Rich Snippets e GEO
 * - Enquadramento no Plano Free do Avalia Solar
 * - Pipeline em lote para importação sem duplicações
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { curateCompany, calculateQualityScore } = require('./curator_engine');
const { applySeoEngine, generateSeoTitle, generateSeoDescription, generateJsonLd } = require('./seo_engine');
const { buildFreeTierCompanyPayload } = require('./free_tier_rules');
const { buildProductPayloads, buildServicePayloads } = require('./catalog_engine');

const SERVER_NAME = 'avalia-curation';
const SERVER_VERSION = '1.0.0';

// Definição das ferramentas expostas pelo MCP
const TOOLS = [
  {
    name: 'curate_company',
    description: 'Analisa e higieniza uma empresa instaladora solar, calculando o Quality Score A+++ (0 a 100), Tier e validações mínimas.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da empresa' },
        phone: { type: 'string', description: 'Telefone ou WhatsApp' },
        state: { type: 'string', description: 'Estado ou sigla (ex: SP, MG)' },
        city: { type: 'string', description: 'Cidade sede' },
        website: { type: 'string', description: 'Website oficial' },
        logoUrl: { type: 'string', description: 'URL do logotipo' },
        inverterSuppliers: { type: 'array', items: { type: 'string' }, description: 'Marcas de inversores homologados' },
        panelSuppliers: { type: 'array', items: { type: 'string' }, description: 'Marcas de painéis solares homologados' },
        batteryStorage: { type: 'boolean', description: 'Se trabalha com baterias BESS' }
      },
      required: ['name']
    }
  },
  {
    name: 'generate_seo_package',
    description: 'Gera pacote completo de SEO/AEO para uma empresa: título canônico, meta description, keywords, Schema.org JSON-LD e tags GEO.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da empresa' },
        city: { type: 'string', description: 'Cidade' },
        state: { type: 'string', description: 'Estado (sigla)' },
        slug: { type: 'string', description: 'Slug de URL' },
        phone: { type: 'string', description: 'Telefone' },
        logoUrl: { type: 'string', description: 'URL do logotipo' },
        batteryStorage: { type: 'boolean', description: 'Trabalha com baterias' }
      },
      required: ['name']
    }
  },
  {
    name: 'build_free_tier_payload',
    description: 'Gera o payload oficial pronto para envio à API do Avalia Solar (POST /api/v1/companies) enquadrado no Plano Free.',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'object', description: 'Objeto completo da empresa curada' }
      },
      required: ['company']
    }
  },
  {
    name: 'run_batch_curation_pipeline',
    description: 'Executa a curadoria completa nível A+++ em lote: lê a base da ENF Solar, remove duplicatas contra o Avalia Solar, higieniza, gera SEO e grava o arquivo final pronto para importação.',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Caminho do arquivo .jsonl bruto (padrão: data/enf_solar/enf_companies_details.jsonl)' },
        outputPath: { type: 'string', description: 'Caminho de saída (padrão: data/enf_solar/enf_companies_a_plus_free_tier.jsonl)' },
        duplicatesReportPath: { type: 'string', description: 'Caminho do relatório de duplicatas (padrão: data/enf_solar/avalia_cross_check_report.json)' },
        minScore: { type: 'number', description: 'Score mínimo aceito para inclusão (padrão: 45 pts)' }
      }
    }
  },
  {
    name: 'build_product_payload',
    description: 'Gera payloads de produtos (kits solares em rascunho, preço sob consulta) atrelados a uma empresa, para POST /api/v1/dashboard/products (autenticado como a empresa). Não grava nada.',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'object', description: 'Empresa (name, slug, city, state, inverterSuppliers, panelSuppliers)' },
        kitsKwp: { type: 'array', items: { type: 'number' }, description: 'Potências dos kits (padrão: 3, 5, 8)' }
      },
      required: ['company']
    }
  },
  {
    name: 'build_service_payload',
    description: 'Gera payloads de serviços (instalação, homologação, O&M) atrelados a uma empresa, para POST /api/v1/dashboard/services (autenticado como a empresa). Não grava nada.',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'object', description: 'Empresa (name, slug, city, state)' },
        coverage: { type: 'array', items: { type: 'string' }, description: 'Cobertura (padrão: estado e cidade)' }
      },
      required: ['company']
    }
  },
  {
    name: 'get_curation_metrics',
    description: 'Retorna estatísticas consolidadas e distribuição de Tiers (A+++, A, B, C) do arquivo de curadoria gerado.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Caminho do arquivo .jsonl curado' }
      }
    }
  }
];

// Handlers das ferramentas
async function handleToolCall(name, args) {
  switch (name) {
    case 'curate_company': {
      const curated = curateCompany(args);
      return {
        curatedCompany: curated,
        quality: curated.qualityAssessment
      };
    }

    case 'generate_seo_package': {
      const withSeo = applySeoEngine(args);
      return withSeo.seo;
    }

    case 'build_free_tier_payload': {
      const curated = curateCompany(args.company);
      const withSeo = applySeoEngine(curated);
      const payload = buildFreeTierCompanyPayload(withSeo);
      return payload;
    }

    case 'build_product_payload': {
      const curated = curateCompany(args.company);
      const withSeo = applySeoEngine(curated);
      return { products: buildProductPayloads({ ...curated, slug: withSeo.slug || curated.slug }, { kitsKwp: args.kitsKwp }) };
    }

    case 'build_service_payload': {
      const curated = curateCompany(args.company);
      const withSeo = applySeoEngine(curated);
      return { services: buildServicePayloads({ ...curated, slug: withSeo.slug || curated.slug }, { coverage: args.coverage }) };
    }

    case 'run_batch_curation_pipeline': {
      const inputPath = path.resolve(args.inputPath || 'data/enf_solar/enf_companies_details.jsonl');
      const outputPath = path.resolve(args.outputPath || 'data/enf_solar/enf_companies_a_plus_free_tier.jsonl');
      const duplicatesPath = path.resolve(args.duplicatesReportPath || 'data/enf_solar/avalia_cross_check_report.json');
      const minScore = args.minScore !== undefined ? args.minScore : 45;

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Arquivo de entrada não encontrado: ${inputPath}`);
      }

      // Carregar IDs duplicados para bloqueio
      const duplicateIds = new Set();
      if (fs.existsSync(duplicatesPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(duplicatesPath, 'utf8'));
          if (Array.isArray(report.exactMatches)) {
            report.exactMatches.forEach(m => duplicateIds.add(m.enf.id));
          }
          if (Array.isArray(report.slugMatches)) {
            report.slugMatches.forEach(m => duplicateIds.add(m.enf.id));
          }
        } catch (e) {}
      }

      const fileStream = fs.createReadStream(inputPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let totalRead = 0;
      let duplicatesSkipped = 0;
      let lowScoreSkipped = 0;
      let totalCurated = 0;
      const tierCounts = { 'A+++': 0, 'A': 0, 'B': 0, 'C': 0 };

      // Limpa arquivo de saída
      fs.writeFileSync(outputPath, '', 'utf8');

      for await (const line of rl) {
        if (!line.trim()) continue;
        totalRead++;
        const raw = JSON.parse(line);

        // Bloqueia duplicata já presente no Avalia Solar
        if (duplicateIds.has(raw.id)) {
          duplicatesSkipped++;
          continue;
        }

        // 1. Curadoria e Higienização
        const curated = curateCompany(raw);
        const score = curated.qualityAssessment.score;
        const tier = curated.qualityAssessment.tier;

        if (score < minScore) {
          lowScoreSkipped++;
          continue;
        }

        // 2. Motor de SEO & AEO
        const withSeo = applySeoEngine(curated);

        // 3. Enquadramento no Plano Free
        const finalPayload = buildFreeTierCompanyPayload(withSeo);

        // 4. Gravação streaming
        fs.appendFileSync(outputPath, JSON.stringify(finalPayload) + '\n', 'utf8');
        totalCurated++;
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      }

      return {
        success: true,
        summary: {
          totalRead,
          duplicatesSkipped,
          lowScoreSkipped,
          totalCuratedClean: totalCurated,
          tierCounts,
          outputFile: outputPath
        }
      };
    }

    case 'get_curation_metrics': {
      const targetPath = path.resolve(args.filePath || 'data/enf_solar/enf_companies_a_plus_free_tier.jsonl');
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Arquivo não encontrado: ${targetPath}`);
      }

      const fileStream = fs.createReadStream(targetPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let count = 0;
      let scoreSum = 0;
      const tiers = {};
      const states = {};

      for await (const line of rl) {
        if (!line.trim()) continue;
        count++;
        const item = JSON.parse(line);
        const score = item.meta?.curation_score || 0;
        const tier = item.meta?.curation_tier || 'N/A';
        const state = item.company?.state || 'Outros';

        scoreSum += score;
        tiers[tier] = (tiers[tier] || 0) + 1;
        states[state] = (states[state] || 0) + 1;
      }

      return {
        totalCompanies: count,
        averageScore: count > 0 ? (scoreSum / count).toFixed(1) : 0,
        tierDistribution: tiers,
        topStates: Object.entries(states).sort((a,b) => b[1]-a[1]).slice(0, 5)
      };
    }

    default:
      throw new Error(`Ferramenta desconhecida: ${name}`);
  }
}

// ── JSON-RPC 2.0 STDIO SERVER IMPLEMENTATION ──
const inputInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

inputInterface.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    // Métodos do protocolo MCP
    if (method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION
          }
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } else if (method === 'notifications/initialized') {
      // Confirmação assíncrona, não retorna payload
    } else if (method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    } else if (method === 'tools/call') {
      try {
        const result = await handleToolCall(params.name, params.arguments || {});
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ],
            isError: false
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (err) {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Erro ao executar ferramenta: ${err.message}`
              }
            ],
            isError: true
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } else {
      const response = {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Método não suportado: ${method}` }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (err) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

// Logs informativos em stderr (não interferem no canal JSON-RPC do stdout)
process.stderr.write(`[${SERVER_NAME}] MCP Server v${SERVER_VERSION} pronto e aguardando conexões via stdio.\n`);
