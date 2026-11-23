/**
 * ENF Solar Brazil - Autonomous Crawler Runner
 * Avalia Solar 2026
 *
 * Executa o crawling completo do diretório da ENF Solar Brasil (2.386 instaladores)
 * com checkpoints automáticos, tratamento de erros, retry exponencial e salvamento contínuo.
 */

const fs = require('fs');
const path = require('path');
const {
  DATA_DIR,
  INDEX_FILE,
  DETAILS_FILE,
  loadProgress,
  saveProgress,
  parseDirectoryHtml,
  parseCompanyProfile
} = require('./enf_crawler');

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_API_KEY) {
  console.error('[ERRO FATAL] FIRECRAWL_API_KEY é obrigatória e não foi configurada no ambiente.');
  process.exit(1);
}
const TOTAL_PAGES = 24;

/**
 * Utilitário de delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Chamada à API do Firecrawl com retry exponencial
 */
async function scrapeUrlWithRetry(url, formats = ['html'], maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          formats,
          proxy: 'basic'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let retrySeconds = 5;
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.retry_after_seconds) {
            retrySeconds = errObj.retry_after_seconds + 1;
          }
        } catch (e) {}

        if (response.status === 429) {
          console.warn(`[Rate Limit 429] Limite atingido. Aguardando ${retrySeconds}s...`);
          await sleep(retrySeconds * 1000);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na resposta do Firecrawl');
      }

      return data.data;
    } catch (err) {
      console.warn(`[Tentativa ${attempt}/${maxRetries}] Falha ao raspar ${url}: ${err.message}`);
      if (attempt < maxRetries) {
        const backoff = attempt * 3000;
        console.log(`Aguardando ${backoff}ms antes de tentar novamente...`);
        await sleep(backoff);
      } else {
        throw err;
      }
    }
  }
}

/**
 * FASE 1: Coletar as páginas de índice (1 a 24)
 */
async function crawlIndexPages() {
  console.log('\n==================================================');
  console.log('🚀 FASE 1: Coletando Páginas de Índice (1 a 24)...');
  console.log('==================================================\n');

  const progress = loadProgress();
  let allCompanies = [];

  if (fs.existsSync(INDEX_FILE)) {
    try {
      allCompanies = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    } catch (e) {
      allCompanies = [];
    }
  }

  const companyMap = new Map(allCompanies.map((c) => [c.id, c]));

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    if (progress.indexPagesCrawled.includes(page)) {
      console.log(`[Página ${page}/${TOTAL_PAGES}] Já coletada anteriormente. Pulando.`);
      continue;
    }

    const pageUrl =
      page === 1
        ? 'https://www.enfsolar.com/directory/installer/Brazil'
        : `https://www.enfsolar.com/directory/installer/Brazil?page=${page}`;

    console.log(`[Página ${page}/${TOTAL_PAGES}] Coletando: ${pageUrl}...`);
    try {
      const result = await scrapeUrlWithRetry(pageUrl, ['html']);
      const companies = parseDirectoryHtml(result.html);

      for (const comp of companies) {
        companyMap.set(comp.id, comp);
      }

      progress.indexPagesCrawled.push(page);
      saveProgress(progress);

      // Salva snapshot no índice consolidado
      const consolidated = Array.from(companyMap.values());
      fs.writeFileSync(INDEX_FILE, JSON.stringify(consolidated, null, 2), 'utf8');

      console.log(
        `✓ [Página ${page}/${TOTAL_PAGES}] ${companies.length} instaladores extraídos. Total acumulado: ${consolidated.length} empresas.`
      );

      // Intervalo entre requisições para estabilidade
      await sleep(1500);
    } catch (err) {
      console.error(`❌ Erro crítico ao coletar página ${page}: ${err.message}`);
      break;
    }
  }

  const finalConsolidated = Array.from(companyMap.values());
  console.log(`\n🎉 FASE 1 Concluída! Total de instaladores no índice: ${finalConsolidated.length}`);
  return finalConsolidated;
}

/**
 * FASE 2: Enriquecer os detalhes das empresas (endereço, telefone, website, marcas)
 */
async function crawlCompanyProfiles(limit = 50) {
  console.log('\n======================================================');
  console.log(`🚀 FASE 2: Enriquecendo Perfis de Empresas (Limite: ${limit})...`);
  console.log('======================================================\n');

  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Índice não encontrado. Execute a Fase 1 primeiro.');
    return;
  }

  const allCompanies = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const progress = loadProgress();
  const crawledSet = new Set(progress.detailsCrawledIds.map(String));

  const pending = allCompanies.filter((c) => !crawledSet.has(String(c.id)));
  console.log(`Total no índice: ${allCompanies.length}`);
  console.log(`Já enriquecidos: ${progress.detailsCrawledIds.length}`);
  console.log(`Pendentes de enriquecimento: ${pending.length}\n`);

  if (pending.length === 0) {
    console.log('Todas as empresas do índice já foram enriquecidas!');
    return;
  }

  const toProcess = pending.slice(0, limit);
  let processedCount = 0;

  for (const company of toProcess) {
    processedCount++;
    const profileUrl = company.enfUrl || `https://www.enfsolar.com/${company.slug}`;
    console.log(
      `[${processedCount}/${toProcess.length}] Coletando perfil de [${company.name}] (${company.state}): ${profileUrl}...`
    );

    try {
      const result = await scrapeUrlWithRetry(profileUrl, ['markdown']);
      const profileData = parseCompanyProfile(result.markdown, {
        id: company.id,
        slug: company.slug,
        enfUrl: profileUrl,
        state: company.state,
        initialBatteryStorage: company.batteryStorage,
        installationSizes: company.installationSizes,
        crawledAt: new Date().toISOString()
      });

      // Se o parser extraiu novo nome ou preservou o do índice
      if (!profileData.name) {
        profileData.name = company.name;
      }

      // Append imediato no arquivo JSONL para garantir persistência contínua
      fs.appendFileSync(DETAILS_FILE, JSON.stringify(profileData) + '\n', 'utf8');

      // Atualiza progresso
      progress.detailsCrawledIds.push(String(company.id));
      saveProgress(progress);

      console.log(
        `✓ [${company.name}] Telefone: ${profileData.phone || 'N/D'} | Site: ${profileData.website || 'N/D'} | Endereço: ${profileData.address || 'N/D'}`
      );

      // Respeita a taxa do Firecrawl (10-12 req/min)
      await sleep(5200);
    } catch (err) {
      console.warn(`Aviso ao coletar empresa [${company.name}]: ${err.message}. Continuando para a próxima.`);
      await sleep(3000);
    }
  }

  console.log(`\n🎉 Lote de enriquecimento concluído! ${processedCount} perfis processados.`);
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const indexOnly = args.includes('--index-only');
  const detailsOnly = args.includes('--details-only');
  const limitArgIndex = args.indexOf('--limit');
  const limit = limitArgIndex !== -1 ? parseInt(args[limitArgIndex + 1], 10) : 50;

  console.log('Iniciando Crawler ENF Solar Brasil...');
  console.log('Opções:', { indexOnly, detailsOnly, limit });

  if (!detailsOnly) {
    await crawlIndexPages();
  }

  if (!indexOnly) {
    await crawlCompanyProfiles(limit);
  }

  console.log('\nExecução concluída com sucesso!');
}

main().catch((err) => {
  console.error('Erro fatal no crawler:', err);
  process.exit(1);
});
