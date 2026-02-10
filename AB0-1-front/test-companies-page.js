#!/usr/bin/env node

/**
 * Comprehensive test script for Companies Page
 * Tests all aspects of the companies listing functionality
 */

const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const isJson = res.headers['content-type']?.includes('application/json');
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: isJson ? JSON.parse(data) : data,
            raw: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            raw: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(name, url, expectations = {}) {
  log(`\n📋 ${name}`, 'bold');
  log(`   URL: ${url}`, 'cyan');
  
  try {
    const response = await makeRequest(url);
    
    // Status code check
    if (expectations.status && response.status !== expectations.status) {
      log(`   ✗ Status: ${response.status} (expected ${expectations.status})`, 'red');
      return false;
    } else {
      log(`   ✓ Status: ${response.status}`, 'green');
    }
    
    // Response type check
    if (response.body && typeof response.body === 'object') {
      log(`   ✓ Response: Valid JSON`, 'green');
      
      // Data array check
      if (Array.isArray(response.body)) {
        log(`   ✓ Format: Direct array with ${response.body.length} items`, 'green');
      } else if (response.body.data && Array.isArray(response.body.data)) {
        log(`   ✓ Format: Object with 'data' array (${response.body.data.length} items)`, 'green');
        
        if (response.body.meta) {
          log(`   ✓ Metadata: Present`, 'green');
          if (response.body.meta.pagination) {
            const p = response.body.meta.pagination;
            log(`     - Total: ${p.total || 'N/A'}`, 'cyan');
            log(`     - Page: ${p.page || 'N/A'}`, 'cyan');
            log(`     - Per Page: ${p.per_page || 'N/A'}`, 'cyan');
          }
        }
        
        // Sample item check
        if (response.body.data.length > 0) {
          const sample = response.body.data[0];
          log(`   ✓ Sample item:`, 'green');
          log(`     - ID: ${sample.id}`, 'cyan');
          log(`     - Name: ${sample.name || 'N/A'}`, 'cyan');
          log(`     - City: ${sample.city || 'N/A'}`, 'cyan');
          log(`     - State: ${sample.state || 'N/A'}`, 'cyan');
        }
      } else {
        log(`   ⚠ Format: Unexpected structure`, 'yellow');
        log(`     Keys: ${Object.keys(response.body).join(', ')}`, 'yellow');
      }
    } else {
      log(`   ✗ Response: Not valid JSON`, 'red');
      log(`     Raw (first 100 chars): ${response.raw?.substring(0, 100)}`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`   ✗ Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(70), 'blue');
  log('🧪 TESTE COMPLETO: Página de Empresas', 'bold');
  log('='.repeat(70), 'blue');
  
  const tests = [
    {
      name: 'Backend API - Listar Todas Empresas',
      url: 'http://localhost:3001/api/v1/companies',
      expectations: { status: 200 }
    },
    {
      name: 'Backend API - Paginação (Página 1)',
      url: 'http://localhost:3001/api/v1/companies?page=1&per_page=12',
      expectations: { status: 200 }
    },
    {
      name: 'Backend API - Filtro por Status',
      url: 'http://localhost:3001/api/v1/companies?status=active',
      expectations: { status: 200 }
    },
    {
      name: 'Backend API - Busca por Nome',
      url: 'http://localhost:3001/api/v1/companies?q=solar',
      expectations: { status: 200 }
    },
    {
      name: 'Backend API - Com Fields Card',
      url: 'http://localhost:3001/api/v1/companies?fields=card&per_page=6',
      expectations: { status: 200 }
    },
    {
      name: 'Frontend Proxy - Via Next.js',
      url: 'http://localhost:3000/api/v1/companies?per_page=3',
      expectations: { status: 200 }
    }
  ];
  
  const results = [];
  for (const test of tests) {
    const passed = await testEndpoint(test.name, test.url, test.expectations);
    results.push({ name: test.name, passed });
  }
  
  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('📊 RESUMO DOS TESTES', 'bold');
  log('='.repeat(70), 'blue');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const symbol = result.passed ? '✓' : '✗';
    const color = result.passed ? 'green' : 'red';
    log(`${symbol} ${result.name}`, color);
  });
  
  log('\n' + '-'.repeat(70), 'cyan');
  log(`Total: ${results.length} | Passou: ${passed} | Falhou: ${failed}`, 'bold');
  log('-'.repeat(70), 'cyan');
  
  if (failed > 0) {
    log('\n⚠️  PROBLEMAS DETECTADOS', 'yellow');
    log('\nAções recomendadas:', 'yellow');
    log('1. Verifique se o backend está rodando: rails server -p 3001');
    log('2. Verifique se o frontend está rodando: npm run dev');
    log('3. Verifique o arquivo .env.local está configurado corretamente');
    log('4. Limpe o cache: npm run dev:clean');
    log('\nPara mais detalhes, consulte: COMPANIES_PAGE_FIX.md\n');
  } else {
    log('\n✅ TODOS OS TESTES PASSARAM!', 'green');
    log('A página de empresas deve estar funcionando corretamente.', 'green');
    log('Acesse: http://localhost:3000/companies\n', 'cyan');
  }
  
  return failed === 0;
}

// Run tests
runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
