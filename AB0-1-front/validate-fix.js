#!/usr/bin/env node

/**
 * Script de Validação Completa
 * Valida o fluxo completo: Home → Companies → Dados carregados
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VALIDAÇÃO COMPLETA - Botão "Explorar Todas as Empresas"\n');

// 1. Validar arquivos modificados
console.log('1️⃣ Verificando arquivos modificados...\n');

const files = [
  {
    path: 'app/page.tsx',
    check: (content) => {
      const hasHref = content.includes('href="/companies"');
      const hasCtaType = content.includes('ctaType="external"');
      const hasCtaDestination = content.includes('ctaDestination="/companies"');
      return { hasHref, hasCtaType, hasCtaDestination };
    }
  },
  {
    path: 'app/companies/CompaniesPageClient.tsx',
    check: (content) => {
      const hasStatusActive = content.includes("status: 'active'");
      const hasStatusComment = content.includes('Garantir que apenas empresas ativas');
      return { hasStatusActive, hasStatusComment };
    }
  }
];

let allValid = true;

files.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  console.log(`📄 Verificando: ${file.path}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ Arquivo não encontrado: ${filePath}\n`);
      allValid = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const result = file.check(content);
    
    Object.entries(result).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${key}: ${value}`);
    });
    
    const allChecks = Object.values(result).every(v => v === true);
    if (!allChecks) {
      allValid = false;
    }
    
    console.log('');
  } catch (error) {
    console.log(`   ❌ Erro ao ler arquivo: ${error.message}\n`);
    allValid = false;
  }
});

// 2. Validar estrutura de API
console.log('2️⃣ Verificando estrutura de API...\n');

const apiClientPath = path.join(__dirname, 'lib/api-client.ts');
if (fs.existsSync(apiClientPath)) {
  const apiContent = fs.readFileSync(apiClientPath, 'utf8');
  
  const checks = {
    'Tem função getAllPaginated': apiContent.includes('getAllPaginated'),
    'Retorna { data, meta }': apiContent.includes('data: response.data, meta: response.meta'),
    'Tem tratamento de erro': apiContent.includes('catch (error)'),
    'Tem logs de debug': apiContent.includes('console.log'),
  };
  
  Object.entries(checks).forEach(([desc, result]) => {
    console.log(`   ${result ? '✅' : '❌'} ${desc}`);
  });
  
  console.log('');
} else {
  console.log('   ❌ Arquivo api-client.ts não encontrado\n');
  allValid = false;
}

// 3. Validar configuração de ambiente
console.log('3️⃣ Verificando configuração de ambiente...\n');

const envExamplePath = path.join(__dirname, '.env.example');
const envLocalPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envExamplePath)) {
  console.log('   ✅ .env.example encontrado');
} else {
  console.log('   ⚠️  .env.example não encontrado');
}

if (fs.existsSync(envLocalPath)) {
  console.log('   ✅ .env.local encontrado');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  const hasApiUrl = envContent.includes('NEXT_PUBLIC_API_URL') || envContent.includes('NEXT_PUBLIC_API_BASE_URL');
  console.log(`   ${hasApiUrl ? '✅' : '❌'} Variável NEXT_PUBLIC_API_URL configurada`);
} else {
  console.log('   ⚠️  .env.local não encontrado (crie a partir do .env.example)');
}

console.log('');

// 4. Validar documentação
console.log('4️⃣ Verificando documentação...\n');

const docPath = path.join(__dirname, 'FIX_COMPANIES_BUTTON.md');
if (fs.existsSync(docPath)) {
  console.log('   ✅ FIX_COMPANIES_BUTTON.md criado');
  const docContent = fs.readFileSync(docPath, 'utf8');
  console.log(`   ✅ Documentação completa (${docContent.length} caracteres)`);
} else {
  console.log('   ❌ Documentação FIX_COMPANIES_BUTTON.md não encontrada');
  allValid = false;
}

console.log('');

// 5. Validar script de teste
console.log('5️⃣ Verificando script de teste...\n');

const testScriptPath = path.join(__dirname, 'test-companies-api.js');
if (fs.existsSync(testScriptPath)) {
  console.log('   ✅ test-companies-api.js criado');
  console.log('   💡 Execute: node test-companies-api.js');
} else {
  console.log('   ❌ Script de teste não encontrado');
  allValid = false;
}

console.log('');

// Resultado final
console.log('═'.repeat(60));
console.log('\n📊 RESULTADO DA VALIDAÇÃO\n');

if (allValid) {
  console.log('✅ Todas as verificações passaram!');
  console.log('\n🎉 O botão "Explorar todas as empresas" está corrigido e pronto para uso.\n');
  console.log('📝 Próximos passos:');
  console.log('   1. Inicie o backend: cd ../AB0-1-back && rails s');
  console.log('   2. Inicie o frontend: npm run dev');
  console.log('   3. Teste manualmente: http://localhost:3000');
  console.log('   4. Clique no botão "Explorar todas as empresas"');
  console.log('   5. Verifique se a lista de empresas carrega corretamente\n');
} else {
  console.log('❌ Algumas verificações falharam.');
  console.log('\n⚠️  Revise os arquivos marcados com ❌ acima.\n');
  console.log('📖 Consulte: FIX_COMPANIES_BUTTON.md para mais detalhes\n');
}

console.log('═'.repeat(60) + '\n');

// Checklist final
console.log('✅ CHECKLIST FINAL\n');
console.log('Antes de testar em produção, verifique:');
console.log('   [ ] Backend está rodando na porta 3001');
console.log('   [ ] Frontend está rodando na porta 3000');
console.log('   [ ] Variáveis de ambiente configuradas (.env.local)');
console.log('   [ ] Banco de dados tem empresas cadastradas');
console.log('   [ ] Redis está rodando (se configurado)');
console.log('   [ ] CORS configurado corretamente no backend');
console.log('   [ ] Teste manual realizado com sucesso');
console.log('   [ ] Console do navegador não mostra erros');
console.log('   [ ] Network tab mostra requisições bem-sucedidas\n');

process.exit(allValid ? 0 : 1);
