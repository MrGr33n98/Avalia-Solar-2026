1const https = require('https');

https.get('https://api.avaliasolar.com.br/api/v1/banners?position=company_profile_about_inline', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
      const banners = JSON.parse(data);
      console.log('Banners retornados da API:', banners.length);
      console.log(JSON.stringify(banners, null, 2));
    } catch (e) {
      console.log('Resposta bruta:', data);
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
