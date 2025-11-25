// Simple script to test the companies API
const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testCompaniesAPI() {
  try {
    console.log('Testing companies API...');
    
    // Test getting all companies
    const allCompaniesResponse = await fetch(`${API_BASE_URL}/companies`);
    if (!allCompaniesResponse.ok) {
      console.error('Error response:', await allCompaniesResponse.text());
      return;
    }
    const allCompaniesData = await allCompaniesResponse.json();
    console.log('All companies:', allCompaniesData);
    
    // If we have companies, try to get the first one
    if (allCompaniesData.companies && allCompaniesData.companies.length > 0) {
      const firstCompany = allCompaniesData.companies[0];
      console.log('First company ID:', firstCompany.id);
      
      // Test getting the first company by ID
      const companyResponse = await fetch(`${API_BASE_URL}/companies/${firstCompany.id}`);
      if (!companyResponse.ok) {
        console.error('Error getting company by ID:', await companyResponse.text());
        return;
      }
      const companyData = await companyResponse.json();
      console.log('Company by ID:', companyData);
    } else {
      console.log('No companies found in the database');
    }
  } catch (error) {
    console.error('Error testing companies API:', error);
  }
}

testCompaniesAPI();