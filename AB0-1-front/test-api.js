// Test script to verify companies API
fetch('http://localhost:3001/api/v1/companies')
  .then(response => response.json())
  .then(data => {
    console.log('Companies data:', data);
    console.log('Number of companies:', data.length);
    if (data.length > 0) {
      console.log('First company:', data[0]);
      console.log('First company has banner_url:', !!data[0].banner_url);
      console.log('First company has logo_url:', !!data[0].logo_url);
    }
  })
  .catch(error => {
    console.error('Error fetching companies:', error);
  });