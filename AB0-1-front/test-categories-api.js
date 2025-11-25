// Test script to verify categories API
fetch('http://localhost:3001/api/v1/categories')
  .then(response => response.json())
  .then(data => {
    console.log('Categories data:', data);
    console.log('Number of categories:', data.length);
    if (data.length > 0) {
      console.log('First category:', data[0]);
      console.log('First category has banner_url:', !!data[0].banner_url);
    }
  })
  .catch(error => {
    console.error('Error fetching categories:', error);
  });