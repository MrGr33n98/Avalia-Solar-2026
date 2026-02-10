#!/usr/bin/env node

/**
 * Diagnostic script to identify why companies page is not loading
 */

const http = require('http');
const https = require('https');

// Configuration
const API_ENDPOINTS = [
  'http://localhost:3001/api/v1/companies',
  'http://localhost:3001/api/v1/companies?page=1&per_page=12',
  'http://localhost:3001/api/v1/companies?status=active',
];

const FRONTEND_URL = 'http://localhost:3000/companies';

// Helper to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data,
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

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run diagnostics
async function runDiagnostics() {
  console.log('\n=== DIAGNÓSTICO: Problema na Página de Empresas ===\n');
  
  // Test 1: Check backend API connectivity
  console.log('📡 Teste 1: Conectividade com API do Backend\n');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`Testando: ${endpoint}`);
      const response = await makeRequest(endpoint);
      
      console.log(`  ✓ Status: ${response.status}`);
      console.log(`  ✓ Content-Type: ${response.headers['content-type']}`);
      
      if (response.body && typeof response.body === 'object') {
        if (Array.isArray(response.body)) {
          console.log(`  ✓ Retornou array com ${response.body.length} empresas`);
        } else if (response.body.data && Array.isArray(response.body.data)) {
          console.log(`  ✓ Retornou objeto com array 'data' contendo ${response.body.data.length} empresas`);
          if (response.body.meta) {
            console.log(`  ✓ Metadados presentes:`, JSON.stringify(response.body.meta, null, 2));
          }
        } else if (response.body.companies && Array.isArray(response.body.companies)) {
          console.log(`  ✓ Retornou objeto com array 'companies' contendo ${response.body.companies.length} empresas`);
        } else {
          console.log(`  ⚠ Estrutura de resposta inesperada:`, Object.keys(response.body));
        }
      } else {
        console.log(`  ✗ Resposta não é JSON válido`);
        console.log(`  Raw response (primeiros 200 chars):`, response.raw?.substring(0, 200));
      }
      console.log('');
    } catch (error) {
      console.log(`  ✗ ERRO: ${error.message}`);
      console.log(`  Possível causa: Backend não está rodando ou não está acessível\n`);
    }
  }
  
  // Test 2: Check frontend API proxy
  console.log('📡 Teste 2: Proxy da API no Frontend\n');
  
  try {
    console.log(`Testando: ${FRONTEND_URL}`);
    const response = await makeRequest(FRONTEND_URL);
    console.log(`  ✓ Status: ${response.status}`);
    console.log(`  ✓ Content-Type: ${response.headers['content-type']}`);
    
    if (response.status === 200) {
      console.log('  ✓ Página de empresas está acessível');
    } else {
      console.log(`  ⚠ Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ ERRO: ${error.message}`);
    console.log(`  Possível causa: Frontend não está rodando\n`);
  }
  
  console.log('\n=== ANÁLISE ===\n');
  console.log('Possíveis causas do problema:');
  console.log('1. ❌ Backend não está rodando (porta 3001)');
  console.log('2. ❌ Variáveis de ambiente não estão configuradas corretamente');
  console.log('3. ❌ API está retornando estrutura de dados diferente da esperada');
  console.log('4. ❌ Problema de CORS ou headers HTTP');
  console.log('5. ❌ Problema com fontes pré-carregadas (Next.js)');
  
  console.log('\n=== SOLUÇÕES RECOMENDADAS ===\n');
  console.log('1. Verificar se o backend está rodando:');
  console.log('   cd AB0-1-back && rails server -p 3001');
  console.log('');
  console.log('2. Verificar variáveis de ambiente (.env.local):');
  console.log('   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001');
  console.log('   API_PROXY_TARGET=http://localhost:3001');
  console.log('');
  console.log('3. Limpar cache do Next.js:');
  console.log('   npm run dev:clean');
  console.log('');
  console.log('4. Verificar logs do navegador (Console e Network)');
  console.log('');
}

// Run the script
runDiagnostics().catch(console.error);
