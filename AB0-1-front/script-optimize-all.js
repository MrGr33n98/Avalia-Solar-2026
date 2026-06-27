const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.resolve(__dirname, 'public');

function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'icones' && file !== 'fonts') { // Evitar diretórios específicos se necessário
        getFilesRecursively(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        fileList.push({
          path: filePath,
          size: stat.size,
          name: file,
          ext: ext
        });
      }
    }
  }
  return fileList;
}

async function optimizeAll() {
  console.log('--- SCANNING PUBLIC IMAGES ---');
  const allImages = getFilesRecursively(publicDir);
  console.log(`Encontradas ${allImages.length} imagens no total.`);

  // Filtra imagens maiores que 50KB
  const targetImages = allImages.filter(img => img.size > 50 * 1024);
  console.log(`Otimizando ${targetImages.length} imagens maiores que 50KB...`);

  let totalSaved = 0;

  for (const img of targetImages) {
    // Evita re-otimizar se o arquivo de destino já existe e a origem não mudou
    // Vamos gerar dois destinos:
    // 1. filename.webp (ex: imagem.webp)
    // 2. filename.ext.webp (ex: imagem.png.webp para Nginx rewrite)

    const baseDir = path.dirname(img.path);
    const baseName = path.basename(img.path, img.ext);
    
    const destWebpStandard = path.join(baseDir, `${baseName}.webp`);
    const destWebpNginx = path.join(baseDir, `${baseName}${img.ext}.webp`);

    console.log(`Processando: ${path.relative(publicDir, img.path)} (${(img.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // 1. Otimizar e gerar standard webp
      await sharp(img.path)
        .webp({ quality: 80 })
        .toFile(destWebpStandard);

      // 2. Otimizar e gerar nginx transparent webp
      await sharp(img.path)
        .webp({ quality: 80 })
        .toFile(destWebpNginx);

      const standardSize = fs.statSync(destWebpStandard).size;
      const pctReduction = (1 - (standardSize / img.size)) * 100;
      totalSaved += (img.size - standardSize);

      console.log(`  -> Standard: ${(standardSize / 1024).toFixed(1)} KB (Redução: ${pctReduction.toFixed(1)}%)`);
    } catch (err) {
      console.error(`  [ERRO] Falha ao processar ${img.name}:`, err.message);
    }
  }

  console.log('====================================');
  console.log(`Otimização concluída! Total economizado (por cópia): ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log('====================================');
}

optimizeAll().catch(console.error);
