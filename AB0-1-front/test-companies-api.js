/**
 * Script de diagnóstico para testar a API de empresas
 * Execute: node test-companies-api.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

async function testCompaniesAPI() {
  console.log('🔍 Testando API de Empresas\n');
  console.log(`Base URL: ${API_BASE}\n`);

  // Teste 1: Verificar health
  console.log('1️⃣ Testando health endpoint...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health OK:', health);
  } catch (error) {
    console.error('❌ Health falhou:', error.message);
    console.log('\n⚠️  Backend não está acessível. Verifique se está rodando na porta 3001');
    return;
  }

  console.log('\n');

  // Teste 2: Listar empresas sem filtros
  console.log('2️⃣ Testando GET /api/v1/companies (sem filtros)...');
  try {
    const response = await fetch(`${API_BASE}/companies`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log(`✅ Resposta recebida`);
    console.log(`Tipo de resposta:`, typeof data);
    console.log(`É array?`, Array.isArray(data));
    console.log(`Tem propriedade 'data'?`, data && typeof data === 'object' && 'data' in data);
    console.log(`Tem propriedade 'companies'?`, data && typeof data === 'object' && 'companies' in data);
    
    if (Array.isArray(data)) {
      console.log(`📊 Total de empresas: ${data.length}`);
      if (data.length > 0) {
        console.log(`📌 Primeira empresa:`, {
          id: data[0].id,
          name: data[0].name,
          slug: data[0].slug,
          status: data[0].status
        });
      }
    } else if (data && data.data) {
      console.log(`📊 Total de empresas: ${data.data.length}`);
      if (data.data.length > 0) {
        console.log(`📌 Primeira empresa:`, {
          id: data.data[0].id,
          name: data.data[0].name,
          slug: data.data[0].slug,
          status: data.data[0].status
        });
      }
    }
  } catch (error) {
    console.error('❌ Falhou:', error.message);
  }

  console.log('\n');

  // Teste 3: Listar empresas ativas
  console.log('3️⃣ Testando GET /api/v1/companies?status=active...');
  try {
    const response = await fetch(`${API_BASE}/companies?status=active`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const companies = Array.isArray(data) ? data : (data.data || []);
    console.log(`✅ Empresas ativas: ${companies.length}`);
  } catch (error) {
    console.error('❌ Falhou:', error.message);
  }

  console.log('\n');

  // Teste 4: Listar empresas com paginação
  console.log('4️⃣ Testando GET /api/v1/companies?page=1&per_page=12...');
  try {
    const response = await fetch(`${API_BASE}/companies?page=1&per_page=12`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`✅ Resposta:`, {
      hasData: !!data.data,
      dataLength: data.data?.length || 0,
      hasMeta: !!data.meta,
      hasPagination: !!data.meta?.pagination,
      total: data.meta?.pagination?.total
    });
  } catch (error) {
    console.error('❌ Falhou:', error.message);
  }

  console.log('\n');

  // Teste 5: Listar empresas featured
  console.log('5️⃣ Testando GET /api/v1/companies?featured=true...');
  try {
    const response = await fetch(`${API_BASE}/companies?featured=true`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const companies = Array.isArray(data) ? data : (data.data || []);
    console.log(`✅ Empresas em destaque: ${companies.length}`);
    
    if (companies.length > 0) {
      console.log('\n📋 Lista de empresas featured:');
      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (ID: ${company.id}, Status: ${company.status})`);
      });
    }
  } catch (error) {
    console.error('❌ Falhou:', error.message);
  }

  console.log('\n');
  console.log('🎉 Diagnóstico completo!');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Se o health falhou, inicie o backend: cd AB0-1-back && rails s');
  console.log('   2. Se não há empresas, execute: cd AB0-1-back && rails db:seed');
  console.log('   3. Verifique as variáveis de ambiente no arquivo .env.local');
}

testCompaniesAPI().catch(console.error);
