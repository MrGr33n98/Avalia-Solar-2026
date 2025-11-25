// Simple test to fetch companies directly
async function testCompaniesFetch() {
  try {
    console.log('Testing companies fetch...');
    
    // Test getting all companies
    const response = await fetch('http://localhost:3001/api/v1/companies?status=active&featured=true&limit=12');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error response:', await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('Companies data:', data);
    
  } catch (error) {
    console.error('Error testing companies fetch:', error);
  }
}

testCompaniesFetch();