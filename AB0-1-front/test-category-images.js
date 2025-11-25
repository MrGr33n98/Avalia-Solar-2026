// Teste para verificar o que está sendo retornado da API de categorias
import { categoriesApi } from '@/lib/api-client';

async function testCategoryCompanies() {
  try {
    console.log('=== Teste de API de Categorias ===');
    
    // Buscar a categoria paineis-solares
    const categories = await categoriesApi.getAll();
    console.log('Categorias disponíveis:', categories.map(c => ({ id: c.id, name: c.name, seo_url: c.seo_url })));
    
    const category = categories.find(c => c.seo_url === 'paineis-solares');
    if (!category) {
      console.error('Categoria paineis-solares não encontrada');
      return;
    }
    
    console.log('Categoria encontrada:', { id: category.id, name: category.name });
    
    // Buscar empresas da categoria
    const companies = await categoriesApi.getCompanies(category.id, { status: 'active' });
    console.log(`Empresas encontradas: ${companies.length}`);
    
    companies.forEach((company, index) => {
      console.log(`\n--- Empresa ${index + 1}: ${company.name} ---`);
      console.log('ID:', company.id);
      console.log('Banner URL:', company.banner_url);
      console.log('Logo URL:', company.logo_url);
      console.log('Status:', company.status);
      console.log('Verified:', company.verified);
      console.log('Campos disponíveis:', Object.keys(company));
      
      // Testar se as URLs são válidas
      if (company.banner_url) {
        console.log('Banner URL válida:', company.banner_url.startsWith('http'));
      }
      if (company.logo_url) {
        console.log('Logo URL válida:', company.logo_url.startsWith('http'));
      }
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar o teste
testCategoryCompanies();