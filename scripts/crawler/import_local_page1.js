const fs = require('fs');
const path = require('path');
const {
  DATA_DIR,
  INDEX_FILE,
  PROGRESS_FILE,
  loadProgress,
  saveProgress,
  parseDirectoryHtml
} = require('./enf_crawler');

const htmlPath = path.resolve(__dirname, '../../enf_directory_brazil.html');
if (!fs.existsSync(htmlPath)) {
  console.error('Arquivo enf_directory_brazil.html não encontrado!');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const companies = parseDirectoryHtml(html);

console.log(`Extraídas ${companies.length} empresas da Página 1.`);

// Salva ou mescla no índice consolidado
let allCompanies = [];
if (fs.existsSync(INDEX_FILE)) {
  try {
    allCompanies = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (e) {
    allCompanies = [];
  }
}

// Dicionário por ID para evitar duplicatas
const map = new Map(allCompanies.map(c => [c.id, c]));
for (const c of companies) {
  map.set(c.id, c);
}

const consolidated = Array.from(map.values());
fs.writeFileSync(INDEX_FILE, JSON.stringify(consolidated, null, 2), 'utf8');
console.log(`Índice atualizado: ${consolidated.length} empresas salvas em ${INDEX_FILE}`);

// Atualiza progresso
const progress = loadProgress();
if (!progress.indexPagesCrawled.includes(1)) {
  progress.indexPagesCrawled.push(1);
}
saveProgress(progress);
console.log('Progresso da página 1 registrado com sucesso!');
