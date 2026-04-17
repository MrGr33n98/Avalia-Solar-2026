const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const renderCarousel = (compId, count, folder) => {
    const outDir = path.join(__dirname, 'out', folder);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Rendering ${compId} (${count} slides)...`);
    for (let i = 0; i < count; i++) {
        console.log(`[${folder}] Rendering slide ${i}...`);
        try {
            execSync(`npx remotion still src/index.ts ${compId} out/${folder}/slide${i}.png --frame=${i} --force`, { stdio: 'inherit' });
        } catch (err) {
            console.error(`Failed to render slide ${i}: ${err.message}`);
        }
    }
};

// Original Presentation Carousel
renderCarousel('AvaliaCarouselSlides', 7, 'slides');

// New Educational/Prospecting Carousels
renderCarousel('AvaliaEduSlides', 11, 'edu-slides');

console.log('All renders complete!');
