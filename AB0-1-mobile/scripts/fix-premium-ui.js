const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

// Mapeamento inteligente de cores Hex para Tokens do Tema
const COLOR_MAP = {
  // Fundos e Superfícies
  '#FFFFFF': 'colors.backgroundElement',
  '#F8FAFC': 'colors.background',
  '#F1F5F9': 'colors.surfaceSubtle',
  '#E2E8F0': 'colors.border',
  '#F3F4F6': 'colors.border', // mapeado para border/surface
  '#0F172A': 'colors.brandDarkBlue',
  '#1E293B': 'colors.backgroundElement', // Escuro genérico
  '#334155': 'colors.border', // Escuro genérico
  '#003E7E': 'colors.brandDarkBlue',

  // Textos
  '#111827': 'colors.text',
  '#1F2937': 'colors.text',
  '#374151': 'colors.text',
  '#4B5563': 'colors.textSecondary',
  '#64748B': 'colors.textSecondary',
  '#6B7280': 'colors.textSecondary',
  '#8E8E93': 'colors.textSecondary',
  '#94A3B8': 'colors.textSecondary',
  '#9CA3AF': 'colors.textSecondary',
  '#CBD5E1': 'colors.border',
  '#D1D5DB': 'colors.border',

  // Cores de Marca / Ações
  '#208AEF': 'colors.tint',
  '#3B82F6': 'colors.brandActiveBlue',
  '#3C9FFE': 'colors.brandActiveBlue',
  '#0274DF': 'colors.brandDarkBlue',
  '#8B5CF6': 'colors.tint', // Roxo mapeado p/ tint (ou podemos manter se for específico)
  '#C3B5F9': 'colors.tint + "40"', // Transparência
  '#F5F3FF': 'colors.tint + "10"', // Transparência
  '#ECE9FC': 'colors.tint + "20"', // Transparência

  // Status
  '#10B981': 'colors.success',
  '#22C55E': 'colors.success',
  '#25D366': 'colors.success', // Verde WhatsApp
  '#E53E3E': 'colors.danger',
  '#EF4444': 'colors.danger',
  '#F59E0B': 'colors.starYellow',
  '#FACC15': 'colors.starYellow',
  '#FFFBEB': 'colors.starYellow + "10"',
};

// Regex para encontrar cores hexadecimais (case insensitive)
const HEX_REGEX = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/gi;

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith('.tsx') && !filepath.includes('constants') && !filepath.includes('node_modules')) {
      callback(filepath);
    }
  });
}

function ensureImportsAndHooks(content) {
  let newContent = content;
  let changed = false;

  // 1. Garantir import do hook useColorScheme
  if (!newContent.includes("import { useColorScheme }") && !newContent.includes("useColorScheme,")) {
    if (newContent.includes("from 'react-native'")) {
      newContent = newContent.replace(/from 'react-native';/, ", useColorScheme } from 'react-native';");
    } else {
      newContent = "import { useColorScheme } from 'react-native';\n" + newContent;
    }
    changed = true;
  }

  // 2. Garantir import do Colors
  if (!newContent.includes("import { Colors }")) {
    newContent = newContent.replace(/(import.*?;)/, "$1\nimport { Colors } from '@/constants/theme';");
    changed = true;
  }

  // 3. Injetar o hook dentro dos componentes principais (Heurística básica: procura por export default function Nome() { )
  const componentRegex = /export\s+(?:default\s+)?function\s+[A-Z]\w*\s*\([^)]*\)\s*\{/g;
  const match = componentRegex.exec(newContent);
  
  if (match) {
    const hookInjection = `\n  const scheme = useColorScheme();\n  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];\n`;
    if (!newContent.includes("const colors = Colors[")) {
      const insertIndex = match.index + match[0].length;
      newContent = newContent.slice(0, insertIndex) + hookInjection + newContent.slice(insertIndex);
      changed = true;
    }
  }

  return { content: newContent, changed };
}

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let originalContent = content;
  let replacements = 0;

  // Primeiro, processamos as cores
  content = content.replace(HEX_REGEX, (match) => {
    const upperMatch = match.toUpperCase();
    if (COLOR_MAP[upperMatch]) {
      replacements++;
      // Checa se está dentro de uma string jsx ou aspas. Simplificação pesada.
      // Se for string pura (ex: color="#FFFFFF"), substitui por color={colors.backgroundElement}
      // Esta heurística é básica e pode precisar de revisão manual, mas acelera 90% do trabalho.
      return COLOR_MAP[upperMatch]; 
    }
    return match; // Mantém se não achar no mapa
  });

  // Ajustes sintáticos para estilos inline que usam aspas: backgroundColor: '#FFFFFF' -> backgroundColor: colors.backgroundElement
  // Usamos regex complexo para limpar as aspas ao redor das cores convertidas
  Object.values(COLOR_MAP).forEach(token => {
    // Procura por 'colors.token' ou "colors.token" e remove as aspas
    const regex1 = new RegExp(`'${token.replace('+', '\\+')}'`, 'g');
    const regex2 = new RegExp(`"${token.replace('+', '\\+')}"`, 'g');
    
    // Procura por prop="colors.token" e transforma em prop={colors.token}
    const regex3 = new RegExp(`(\\w+)="${token.replace('+', '\\+')}"`, 'g');
    
    content = content.replace(regex3, `$1={${token}}`);
    content = content.replace(regex1, token);
    content = content.replace(regex2, token);
  });

  if (replacements > 0 || content !== originalContent) {
    // Se mudou cor, tenta injetar imports e hooks
    const updatedContent = ensureImportsAndHooks(content);
    
    fs.writeFileSync(filepath, updatedContent.content, 'utf8');
    console.log(`✅ Refatorado: ${path.basename(filepath)} (${replacements} cores)`);
  }
}

console.log('🚀 Iniciando Script de Auto-Correção Premium UI...');
walk(SRC_DIR, processFile);
console.log('🎉 Concluído! Lembre-se de rodar o linting (npm run lint:fix) e verificar o app manualmente.');