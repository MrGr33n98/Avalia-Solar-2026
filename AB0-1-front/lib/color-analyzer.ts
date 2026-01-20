export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
}

export interface DesignStyle {
  name: string;
  palette: ExtractedPalette;
  typography: {
    fontFamily: string;
    headingSize: string;
    bodySize: string;
  };
  elements: {
    borderRadius: string;
    shadow: string;
    borderWidth: string;
  };
}

/**
 * Analisa uma imagem e extrai a paleta de cores dominante.
 * Usa um canvas temporário para processar os pixels da imagem.
 */
export async function analyzeImageStyle(imageSrc: string): Promise<DesignStyle> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar o contexto do canvas'));
        return;
      }

      // Redimensiona para análise rápida
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size).data;
      const colorCounts: { [key: string]: number } = {};
      const colors: { r: number; g: number; b: number }[] = [];

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // Ignora transparência

        const rgb = `${r},${g},${b}`;
        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        colors.push({ r, g, b });
      }

      // Ordena cores por frequência
      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([rgb]) => rgb);

      const getHex = (rgbStr: string) => {
        const [r, g, b] = rgbStr.split(',').map(Number);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      };

      // Define uma paleta baseada nas cores encontradas
      const primary = sortedColors[0] ? getHex(sortedColors[0]) : '#3b82f6';
      const secondary = sortedColors[1] ? getHex(sortedColors[1]) : '#64748b';
      const accent = sortedColors[2] ? getHex(sortedColors[2]) : '#10b981';
      
      // Heurística simples para detectar se a imagem é predominantemente clara ou escura
      let totalBrightness = 0;
      for (const color of colors) {
        totalBrightness += (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
      }
      const avgBrightness = totalBrightness / colors.length;
      const isDark = avgBrightness < 128;

      const style: DesignStyle = {
        name: 'Estilo Detectado',
        palette: {
          primary,
          secondary,
          accent,
          background: isDark ? '#0f172a' : '#f8fafc',
          foreground: isDark ? '#f8fafc' : '#0f172a',
          muted: isDark ? '#1e293b' : '#f1f5f9',
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          headingSize: '2.25rem',
          bodySize: '1rem',
        },
        elements: {
          borderRadius: '0.5rem',
          shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          borderWidth: '1px',
        },
      };

      resolve(style);
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar a imagem para análise'));
    };
  });
}
