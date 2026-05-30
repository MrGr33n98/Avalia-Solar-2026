const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const images = [
  { name: 'pricing-ad-preview.png', relPath: 'public/images/pricing/pricing-ad-preview.png' },
  { name: 'pricing-hero-mockup.png', relPath: 'public/images/pricing/pricing-hero-mockup.png' },
  { name: 'pricing-hero-solar-bg.jpg', relPath: 'public/images/pricing/pricing-hero-solar-bg.jpg' }
];

async function runAudit() {
  console.log('--- AUDITORIA DE IMAGENS ORIGINAIS ---');
  for (const img of images) {
    const fullPath = path.resolve(img.relPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Arquivo não encontrado: ${img.name} em ${fullPath}`);
      continue;
    }
    const stats = fs.statSync(fullPath);
    const metadata = await sharp(fullPath).metadata();
    console.log(`Imagem: ${img.name}`);
    console.log(`- Caminho: ${fullPath}`);
    console.log(`- Tamanho: ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);
    console.log(`- Dimensões: ${metadata.width}x${metadata.height} px`);
    console.log(`- Formato: ${metadata.format}`);
  }
}

runAudit().catch(err => console.error(err));
