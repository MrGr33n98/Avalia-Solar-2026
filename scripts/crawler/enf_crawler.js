/**
 * ENF Solar Brazil - Full Directory & Profile Crawler
 * Avalia Solar 2026
 *
 * Objetivo:
 * Coletar todos os 2.386 instaladores solares do Brasil listados no diretório da ENF Solar
 * (https://www.enfsolar.com/directory/installer/Brazil) e seus dados de perfil:
 * - Razão social / Nome fantasia
 * - Endereço completo (Rua, Número, Bairro, Cidade, Estado, CEP)
 * - Telefone comercial / WhatsApp
 * - Website oficial
 * - Marcas de inversores e painéis homologados
 * - Capacidade de baterias e porte de instalação
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data/enf_solar');
const INDEX_FILE = path.join(DATA_DIR, 'enf_installers_index.json');
const DETAILS_FILE = path.join(DATA_DIR, 'enf_companies_details.jsonl');
const PROGRESS_FILE = path.join(DATA_DIR, 'crawler_progress.json');

// Garante que o diretório de dados exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Lê o estado de progresso para permitir interrupção e retomada
 */
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch (e) {
      console.warn('Aviso: Não foi possível ler crawler_progress.json, reiniciando estado.');
    }
  }
  return {
    indexPagesCrawled: [],
    detailsCrawledIds: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveProgress(progress) {
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

/**
 * Parser de página de listagem da ENF Solar
 */
function parseDirectoryHtml(html) {
  const rowRegex = /<tr class="mkjs-el[^"]*"[^>]*data-company-id="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
  const companies = [];

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const companyId = match[1];
    const rowHtml = match[2];

    const linkMatch = rowHtml.match(/<a\s+href="([^"]+)"[^>]*class="[^"]*mkjs-a[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const enfUrl = linkMatch ? linkMatch[1] : null;
    const name = linkMatch ? linkMatch[2].trim() : null;

    const tds = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(td => td[1].trim());

    const state = tds[1] ? tds[1].replace(/<[^>]+>/g, '').trim() : null;
    const batteryStorage = tds[2] ? tds[2].replace(/<[^>]+>/g, '').trim() : '';
    const startingDate = tds[3] ? tds[3].replace(/<[^>]+>/g, '').trim() : null;
    const hasSmaller = tds[4] ? tds[4].includes('Smaller Installations') : false;
    const has1MWp = tds[4] ? tds[4].includes('1MWp+ Installations') : false;
    const country = tds[5] ? tds[5].replace(/<[^>]+>/g, '').trim() : 'Brazil';

    if (name) {
      companies.push({
        id: companyId,
        name,
        slug: enfUrl ? enfUrl.split('?')[0].replace('https://www.enfsolar.com/', '').trim() : null,
        enfUrl: enfUrl ? enfUrl.split('?')[0] : null,
        state,
        batteryStorage: batteryStorage.toLowerCase() === 'yes',
        startingDate: startingDate || null,
        installationSizes: [
          ...(hasSmaller ? ['smaller'] : []),
          ...(has1MWp ? ['1mwp_plus'] : [])
        ],
        country
      });
    }
  }

  return companies;
}

/**
 * Parser de detalhes de uma empresa individual a partir do markdown/HTML da ENF Solar
 */
function parseCompanyProfile(markdown, meta = {}) {
  const result = {
    name: null,
    address: null,
    phone: null,
    website: null,
    logoUrl: null,
    batteryStorage: null,
    installationSize: null,
    inverterSuppliers: [],
    panelSuppliers: [],
    lastUpdate: null,
    ...meta
  };

  // Logo
  const logoMatch = markdown.match(/!\[([^\]]*)\]\((https:\/\/cdn\.enfsolar\.com\/ID\/logo\/[^\)]+)\)/i);
  if (logoMatch) {
    result.logoUrl = logoMatch[2];
  }

  // Título / Nome
  const titleMatch = markdown.match(/# ([^\n\r]+)/);
  if (titleMatch) {
    result.name = titleMatch[1].trim();
  }

  // Telefone (+55 ...)
  const phoneMatch = markdown.match(/\[(\+55[0-9\s\-]+)\]\(tel:/i) || markdown.match(/(\+55\s*[0-9]{2,4}\s*[0-9]{4,5}\s*[0-9]{4})/);
  if (phoneMatch) {
    result.phone = phoneMatch[1].trim();
  }

  // Website oficial
  const websiteMatch = markdown.match(/\[(https?:\/\/[^\s\]"]+)\]\(\1/i) || markdown.match(/\[https?:\/\/[^\]]+\]\((https?:\/\/[^\s\)"']+)/i);
  if (websiteMatch) {
    result.website = websiteMatch[1].trim();
  }

  // Endereço (normalmente linha em tabela antes do telefone ou após logo)
  const addressMatch = markdown.match(/\|\s*\|\s*([^\|\n\r]+(?:Rua|Av|Avenida|Rodovia|Alameda|Travessa|Estrada|Praça|SL|Sala|Brumadinho|São Paulo|Minas|Rio)[^\|\n\r]+)\s*\|/i) ||
                       markdown.match(/\|\s*\|\s*([A-Za-z0-9À-ÖØ-öø-ÿ\s,°ºª\.\-\/]+,\s*[A-Z]{2},\s*[0-9]{5}-?[0-9]{3})\s*\|/i);
  if (addressMatch) {
    result.address = addressMatch[1].trim();
  }

  // Inverter Suppliers
  const inverterMatch = markdown.match(/Inverter Suppliers[\s\n\r]+([^\n\r]+)/i);
  if (inverterMatch) {
    const rawSuppliers = inverterMatch[1];
    const brands = [...rawSuppliers.matchAll(/\[([^\]]+)\]/g)].map(b => b[1].trim());
    result.inverterSuppliers = brands.length > 0 ? brands : rawSuppliers.split(',').map(s => s.trim());
  }

  // Panel Suppliers
  const panelMatch = markdown.match(/Panel Suppliers[\s\n\r]+([^\n\r]+)/i);
  if (panelMatch) {
    const rawSuppliers = panelMatch[1];
    const brands = [...rawSuppliers.matchAll(/\[([^\]]+)\]/g)].map(b => b[1].trim());
    result.panelSuppliers = brands.length > 0 ? brands : rawSuppliers.split(',').map(s => s.trim());
  }

  // Battery Storage
  const batteryMatch = markdown.match(/Battery Storage[\s\n\r]+(Yes|No)/i);
  if (batteryMatch) {
    result.batteryStorage = batteryMatch[1].toLowerCase() === 'yes';
  }

  // Installation Size
  const sizeMatch = markdown.match(/Installation size[\s\n\r]+([^\n\r]+)/i);
  if (sizeMatch) {
    result.installationSize = sizeMatch[1].trim();
  }

  return result;
}

// Exporta funções do módulo para uso via CLI ou scripts
module.exports = {
  DATA_DIR,
  INDEX_FILE,
  DETAILS_FILE,
  PROGRESS_FILE,
  loadProgress,
  saveProgress,
  parseDirectoryHtml,
  parseCompanyProfile
};

if (require.main === module) {
  console.log('=== ENF Solar Crawler Engine ===');
  console.log('Diretório de dados:', DATA_DIR);
  const progress = loadProgress();
  console.log('Progresso atual:');
  console.log(`- Páginas de índice coletadas: ${progress.indexPagesCrawled.length}/24`);
  console.log(`- Perfis detalhados coletados: ${progress.detailsCrawledIds.length}`);
}
