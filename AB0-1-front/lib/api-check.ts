import { fetchApi } from './api';

// Function to check API endpoints with multiple configurations
export async function checkApiEndpoints() {
  const baseUrls = [
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001'
  ];
  
  const apiPrefixes = [
    '/api/v1',
    '',
    '/v1'
  ];
  
  const resources = [
    'companies',
    'products',
    'categories',
    'reviews'
  ];
  
  console.log('Checking API endpoints with multiple configurations...');
  
  for (const baseUrl of baseUrls) {
    console.log(`Testing base URL: ${baseUrl}`);
    
    for (const prefix of apiPrefixes) {
      console.log(`  With prefix: "${prefix}"`);
      
      for (const resource of resources) {
        const endpoint = `${prefix}/${resource}`.replace(/\/\//g, '/');
        const fullUrl = `${baseUrl}${endpoint}`;
        
        try {
          console.log(`    Testing: ${fullUrl}`);
          const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            signal: AbortSignal.timeout(3000)
          });
          
          console.log(`    Status: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`    ✅ SUCCESS! Received ${Array.isArray(data) ? data.length : 1} items`);
            console.log(`    Working configuration: ${fullUrl}`);
            return { baseUrl, prefix, resource, data };
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.log(`    ❌ Failed: ${message}`);
        }
      }
    }
  }
  
  console.log('No working API configuration found.');
  return null;
}

// Function to test a specific endpoint with detailed logging
export async function testEndpoint(baseUrl: string, endpoint: string) {
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log(`Testing specific endpoint: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return null;
    } else {
      const data = await response.json();
      console.log(`Response data sample:`, 
        Array.isArray(data) ? data.slice(0, 2) : data);
      return data;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Exception: ${message}`);
    return null;
  }
}

// Function to find working API configuration and update API settings
export async function findWorkingApiConfig() {
  console.log('Searching for working API configuration...');
  const result = await checkApiEndpoints();
  
  if (result) {
    const { baseUrl, prefix } = result;
    console.log(`Found working API at: ${baseUrl}${prefix}`);
    console.log('You should update your API_BASE_URL in api.ts to:');
    console.log(`const API_BASE_URL = '${baseUrl}';`);
    
    if (prefix) {
      console.log('And update your fetchApi function to use:');
      console.log(`const apiEndpoint = endpoint.startsWith('${prefix}') ? endpoint : '${prefix}' + endpoint;`);
    }
    
    return result;
  }
  
  console.log('Could not find a working API configuration.');
  return null;
}

// Function to provide mock data for development
export function getMockData(type: string) {
  const mockData: Record<string, any[]> = {
    products: [
      {
        id: 1,
        name: "Painel Solar 450W",
        description: "Painel solar monocristalino de alta eficiência",
        price: 1200.00,
        company_id: 1,
        created_at: "2023-01-15T10:30:00Z",
        updated_at: "2023-01-15T10:30:00Z"
      },
      {
        id: 2,
        name: "Inversor 5kW",
        description: "Inversor solar grid-tie com monitoramento",
        price: 3500.00,
        company_id: 2,
        created_at: "2023-01-16T14:20:00Z",
        updated_at: "2023-01-16T14:20:00Z"
      }
    ],
    companies: [
      {
        id: 1,
        name: "Solar Solutions",
        description: "Empresa especializada em instalações solares residenciais",
        website: "https://solarsolutions.example.com",
        phone: "(11) 99999-8888",
        address: "Av. Paulista, 1000, São Paulo, SP",
        created_at: "2023-01-10T08:00:00Z",
        updated_at: "2023-01-10T08:00:00Z"
      },
      {
        id: 2,
        name: "Eco Energy",
        description: "Soluções completas em energia solar",
        website: "https://ecoenergy.example.com",
        phone: "(11) 98888-7777",
        address: "Rua Augusta, 500, São Paulo, SP",
        created_at: "2023-01-11T09:15:00Z",
        updated_at: "2023-01-11T09:15:00Z"
      }
    ],
    categories: [
      {
        id: 1,
        name: "Painéis Solares",
        seo_url: "paineis-solares",
        seo_title: "Painéis Solares | Compare Solar",
        short_description: "Painéis solares de alta eficiência",
        description: "Encontre os melhores painéis solares para sua instalação",
        parent_id: null,
        kind: "product",
        status: "active",
        featured: true,
        created_at: "2023-01-05T10:00:00Z",
        updated_at: "2023-01-05T10:00:00Z"
      },
      {
        id: 2,
        name: "Inversores",
        seo_url: "inversores",
        seo_title: "Inversores | Compare Solar",
        short_description: "Inversores para sistemas fotovoltaicos",
        description: "Compare os melhores inversores do mercado",
        parent_id: null,
        kind: "product",
        status: "active",
        featured: true,
        created_at: "2023-01-06T11:30:00Z",
        updated_at: "2023-01-06T11:30:00Z"
      }
    ]
  };
  
  return mockData[type] || [];
}

// Export a function to run the check from browser console
export function runApiCheck() {
  console.log('Running API endpoint check...');
  findWorkingApiConfig();
}
