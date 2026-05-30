const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const targets = [
  {
    src: 'public/images/pricing/pricing-hero-mockup.png',
    dest: 'public/images/pricing/pricing-hero-mockup.webp',
    width: 1200,
    fit: 'inside'
  },
  {
    src: 'public/images/pricing/pricing-hero-solar-bg.jpg',
    dest: 'public/images/pricing/pricing-hero-solar-bg.webp',
    width: 1600,
    fit: 'inside'
  },
  {
    src: 'public/images/pricing/pricing-ad-preview.png',
    dest: 'public/images/pricing/pricing-ad-preview.webp',
    width: 600,
    height: 600,
    fit: 'cover'
  }
];

async function runOptimization() {
  console.log('--- OTIMIZAÇÃO DE IMAGENS ---');
  for (const t of targets) {
    const srcPath = path.resolve(t.src);
    const destPath = path.resolve(t.dest);
    
    if (!fs.existsSync(srcPath)) {
      console.log(`Erro: arquivo de origem não encontrado: ${t.src}`);
      continue;
    }
    
    const originalStats = fs.statSync(srcPath);
    console.log(`Processando ${t.src}...`);
    
    let pipeline = sharp(srcPath);
    
    // Redimensionamento
    const resizeOpts = { width: t.width, fit: t.fit };
    if (t.height) {
      resizeOpts.height = t.height;
    }
    pipeline = pipeline.resize(resizeOpts);
    
    // Converter para webp
    pipeline = pipeline.webp({ quality: 82 });
    
    await pipeline.toFile(destPath);
    
    const optimizedStats = fs.statSync(destPath);
    const metadata = await sharp(destPath).metadata();
    
    console.log(`Salvo em ${t.dest}`);
    console.log(`- Dimensões otimizadas: ${metadata.width}x${metadata.height} px`);
    console.log(`- Tamanho original: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`- Tamanho otimizado: ${(optimizedStats.size / 1024).toFixed(2)} KB`);
    console.log(`- Redução: ${((1 - (optimizedStats.size / originalStats.size)) * 105 - 5).toFixed(1)}%`);
    console.log('------------------------');
  }
}

runOptimization().catch(err => console.error(err));
