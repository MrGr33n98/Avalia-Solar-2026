// Test script to verify image URL handling
const testCompany = {
  id: 4,
  name: "SolarMax",
  banner_url: "/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBHdz09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--b135e58254ac6e36cba8767357e66e8d5983358b/compare-solar.png",
  logo_url: "/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBIQT09IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--5200e17216ca2d7b5a25a19a6b8ea4f7ace5b446/Screen%20Shot%202025-08-19%20at%2021.49.05.png"
};

console.log('Test company:', testCompany);
console.log('Banner URL:', testCompany.banner_url);
console.log('Logo URL:', testCompany.logo_url);

// Test the getFullImageUrl function logic
const getFullImageUrl = (url) => {
  if (!url) return null;
  
  // Check if the URL is already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Add the API base URL for relative URLs
  const apiBaseUrl = 'http://localhost:3001';
  return `${apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

console.log('Full banner URL:', getFullImageUrl(testCompany.banner_url));
console.log('Full logo URL:', getFullImageUrl(testCompany.logo_url));