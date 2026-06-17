const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const HEX_REGEX = /#[0-9A-Fa-f]{3,6}/g;
const HARDCODED_COLORS = ['white', 'black', 'blue', 'red', 'green', 'yellow'];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

console.log('🔍 Iniciando Auditoria Premium UI...');
let violations = 0;

walk(SRC_DIR, (filepath) => {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Ignorar constantes/tema e node_modules
    if (filepath.includes('constants/theme.ts')) return;

    let hasViolation = false;
    
    // Check hex colors
    const hexMatches = line.match(HEX_REGEX);
    if (hexMatches) {
      console.warn(`⚠️ Hex Color detectada em ${filepath}:${index + 1}: ${line.trim()}`);
      hasViolation = true;
    }

    // Check hardcoded color names in styles
    HARDCODED_COLORS.forEach(color => {
      if (line.includes(`'${color}'`) || line.includes(`"${color}"`)) {
        console.warn(`⚠️ Cor hardcoded ('${color}') detectada em ${filepath}:${index + 1}`);
        hasViolation = true;
      }
    });

    if (hasViolation) violations++;
  });
});

if (violations > 0) {
  console.log(`\n❌ Total de violações Premium UI: ${violations}`);
  console.log('💡 Sugestão: Use Colors[scheme] de @/constants/theme para manter a consistência.');
} else {
  console.log('\n✅ Nenhuma violação Premium UI detectada! Excelente trabalho.');
}
