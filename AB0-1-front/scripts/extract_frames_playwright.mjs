#!/usr/bin/env node
/**
 * extract_frames_playwright.mjs
 *
 * Alternativa Node.js/Playwright para extrair quadros WebP de um vídeo MP4
 * SEM dependências nativas de ffmpeg ou Python/OpenCV.
 *
 * Usa o Playwright para abrir um browser headless, carregar o <video>,
 * dar seek time a time e capturar via <canvas>, depois equaliza o white-point
 * com o 'sharp' (que está nas dependências do projeto).
 *
 * Uso:
 *   node scripts/extract_frames_playwright.mjs \
 *     --video public/videos/O_Raio_X_e_Fluxo_de_Energi.mp4 \
 *     --output public/videos/raio-x-fluxo-energia-frames \
 *     --output-mobile public/videos/raio-x-fluxo-energia-frames-mobile \
 *     --frames 120 \
 *     --quality 88
 */

import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      if (val && !val.startsWith("--")) {
        args[name] = val;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

/**
 * Equaliza o white-point de um buffer PNG (vindo do canvas) e salva como WebP.
 * Aplica o mesmo algoritmo do script Python: highlight lift + edge fade + bg clamp.
 */
async function equalizeAndSave(
  bufferPng,
  outPath,
  opts = {
    whiteThreshold: 225,
    edgePadPx: 60,
    quality: 88,
    maxWidth: null,
  }
) {
  let pipeline = sharp(bufferPng, { animated: false });
  const metadata = await pipeline.metadata();
  const w = metadata.width || 1280;
  const h = metadata.height || 720;

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const arr = new Uint8ClampedArray(data);
  const channels = info.channels;

  const edgePadPx = opts.edgePadPx;
  const whiteThreshold = opts.whiteThreshold;
  const scaleToWhite = 255.0 / whiteThreshold;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * channels;
      let r = arr[idx];
      let g = arr[idx + 1];
      let b = arr[idx + 2];
      const a = channels >= 4 ? arr[idx + 3] : 255;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (r > 170) r = clamp(Math.round(r * scaleToWhite), 0, 255);
      if (g > 170) g = clamp(Math.round(g * scaleToWhite), 0, 255);
      if (b > 170) b = clamp(Math.round(b * scaleToWhite), 0, 255);

      const distX = Math.min(x, w - 1 - x) / edgePadPx;
      const distY = Math.min(y, h - 1 - y) / edgePadPx;
      const edgeFade = clamp(Math.min(distX, distY), 0, 1);

      if (lum > 140) {
        r = Math.round(255 - (255 - r) * edgeFade);
        g = Math.round(255 - (255 - g) * edgeFade);
        b = Math.round(255 - (255 - b) * edgeFade);
      }

      arr[idx] = r;
      arr[idx + 1] = g;
      arr[idx + 2] = b;
      if (channels >= 4) arr[idx + 3] = a;
    }
  }

  let out = sharp(Buffer.from(arr.buffer), {
    raw: { width: w, height: h, channels },
  });

  if (opts.maxWidth && w > opts.maxWidth) {
    out = out.resize({ width: opts.maxWidth, withoutEnlargement: true });
  }

  await out.webp({ quality: opts.quality, effort: 4 }).toFile(outPath);
}

async function main() {
  const args = parseArgs(process.argv);
  const videoRel = args.video;
  const outputRel = args.output;
  const outputMobileRel = args["output-mobile"] || null;
  const totalFrames = parseInt(args.frames || "120", 10);
  const quality = parseInt(args.quality || "88", 10);
  const mobileQuality = parseInt(args["mobile-quality"] || "82", 10);
  const mobileMaxWidth = parseInt(args["mobile-max-width"] || "800", 10);

  if (!videoRel || !outputRel) {
    console.error(
      "[ERRO] Uso: node scripts/extract_frames_playwright.mjs --video <video.mp4> --output <frames-dir>"
    );
    process.exit(1);
  }

  const videoPath = path.resolve(PROJECT_ROOT, videoRel);
  const outputDir = path.resolve(PROJECT_ROOT, outputRel);
  const outputMobileDir = outputMobileRel
    ? path.resolve(PROJECT_ROOT, outputMobileRel)
    : null;

  if (!fs.existsSync(videoPath)) {
    console.error(`[ERRO] Vídeo não encontrado: ${videoPath}`);
    process.exit(1);
  }

  await ensureDir(outputDir);
  if (outputMobileDir) await ensureDir(outputMobileDir);

  const videoFileUrl = `file://${videoPath}`;

  const htmlCapture = `<!doctype html><html><body style="margin:0;background:#fff">
    <video id="v" crossorigin="anonymous" preload="auto" style="position:absolute;left:-99999px"></video>
    <canvas id="c" style="position:absolute;left:-99999px"></canvas>
    <script>
      window.__capture = async function(timeMs, outW, outH) {
        const v = document.getElementById('v');
        if (v.src !== '${videoFileUrl}') v.src = '${videoFileUrl}';
        await new Promise((res,rej) => {
          if (v.readyState >= 1) return res();
          v.onloadedmetadata = res;
          v.onerror = rej;
        });
        const dur = v.duration * 1000;
        const seekMs = Math.min(Math.max(0, timeMs), Math.max(0, dur - 16));
        return await new Promise((resolve, reject) => {
          const cleanup = () => {
            v.removeEventListener('seeked', onSeeked);
            v.removeEventListener('error', onError);
          };
          const onSeeked = () => {
            const vw = v.videoWidth || 1280;
            const vh = v.videoHeight || 720;
            const c = document.getElementById('c');
            const W = outW || vw;
            const H = outH || vh;
            c.width = W; c.height = H;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,W,H);
            ctx.drawImage(v, 0, 0, W, H);
            const dataUrl = c.toDataURL('image/png');
            cleanup();
            resolve({ dataUrl, width: W, height: H, durationMs: dur });
          };
          const onError = () => { cleanup(); reject(new Error('video error')); };
          v.addEventListener('seeked', onSeeked);
          v.addEventListener('error', onError);
          try { v.currentTime = seekMs / 1000; } catch (e) { reject(e); }
        });
      };
    <\/script>
  </body></html>`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent(htmlCapture, { waitUntil: "domcontentloaded" });

  let durationMs = 0;

  console.log(
    `[INFO] Extraindo ${totalFrames} quadros de:\n       ${videoPath}\n` +
      `       Desktop -> ${outputDir}\n` +
      (outputMobileDir ? `       Mobile  -> ${outputMobileDir}\n` : "")
  );

  for (let i = 0; i < totalFrames; i++) {
    const t = (i / Math.max(1, totalFrames - 1)) * 1.0;
    const safeMs =
      durationMs > 0
        ? t * durationMs
        : t * 60_000;

    const result = await page.evaluate(
      ([timeMs]) => window.__capture(timeMs),
      [safeMs]
    );

    if (i === 0) {
      durationMs = result.durationMs || 60_000;
      console.log(`[INFO] Duração do vídeo: ${(durationMs / 1000).toFixed(2)}s`);

      const retargetMs = t * durationMs;
      if (Math.abs(safeMs - retargetMs) > 50) {
        const r2 = await page.evaluate(
          ([timeMs]) => window.__capture(timeMs),
          [retargetMs]
        );
        Object.assign(result, r2);
      }
    }

    const header = "data:image/png;base64,";
    const base64 = result.dataUrl.startsWith(header)
      ? result.dataUrl.slice(header.length)
      : result.dataUrl;
    const pngBuf = Buffer.from(base64, "base64");

    const fileName = `frame_${String(i).padStart(3, "0")}.webp`;
    const desktopPath = path.join(outputDir, fileName);

    await equalizeAndSave(pngBuf, desktopPath, {
      whiteThreshold: 225,
      edgePadPx: 60,
      quality,
    });

    if (outputMobileDir) {
      const mobilePath = path.join(outputMobileDir, fileName);
      await equalizeAndSave(pngBuf, mobilePath, {
        whiteThreshold: 225,
        edgePadPx: 50,
        quality: mobileQuality,
        maxWidth: mobileMaxWidth,
      });
    }

    if ((i + 1) % 10 === 0 || i === totalFrames - 1) {
      console.log(`       • ${i + 1}/${totalFrames} quadros salvos`);
    }
  }

  await browser.close();

  const fmt = (p) =>
    (
      fs.readdirSync(p).reduce((acc, f) => {
        try {
          return (
            acc + fs.statSync(path.join(p, f)).size / (1024 * 1024)
          );
        } catch {
          return acc;
        }
      }, 0) || 0
    ).toFixed(1);

  console.log(
    `\n[SUCESSO] ${totalFrames} quadros gerados.\n` +
      `         • Desktop: ${outputDir} (~${fmt(outputDir)} MB)\n` +
      (outputMobileDir
        ? `         • Mobile:  ${outputMobileDir} (~${fmt(outputMobileDir)} MB)`
        : "")
  );
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
