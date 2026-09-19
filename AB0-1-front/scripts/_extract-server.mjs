#!/usr/bin/env node
/**
 * Servidor HTTP mínimo para extração de quadros via browser.
 *
 *   1. Serve arquivos estáticos de AB0-1-front/public/ (incluindo o vídeo .mp4)
 *   2. Expõe POST /save-frame → recebe { index, dataUrl: "data:image/webp;base64,..." }
 *      e grava cada quadro com equalização de ponto de branco via `sharp`.
 *
 * Uso:  node scripts/_extract-server.mjs  [--frames-out DIR] [--frames-mobile DIR]
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.resolve(PROJECT_ROOT, "public");

function parseArgs(argv) {
  const out = {
    framesOut: path.resolve(PUBLIC_DIR, "videos/raio-x-fluxo-energia-frames"),
    framesMobile: path.resolve(
      PUBLIC_DIR,
      "videos/raio-x-fluxo-energia-frames-mobile"
    ),
    totalFrames: 120,
    quality: 88,
    mobileQuality: 82,
    mobileMaxWidth: 800,
    port: 3987,
  };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--frames-out" && v) {
      out.framesOut = path.resolve(PROJECT_ROOT, v);
      i++;
    } else if (k === "--frames-mobile" && v) {
      out.framesMobile = path.resolve(PROJECT_ROOT, v);
      i++;
    } else if (k === "--total" && v) {
      out.totalFrames = parseInt(v, 10);
      i++;
    } else if (k === "--port" && v) {
      out.port = parseInt(v, 10);
      i++;
    }
  }
  return out;
}

const OPTS = parseArgs(process.argv);
await fs.promises.mkdir(OPTS.framesOut, { recursive: true });
if (OPTS.framesMobile) {
  await fs.promises.mkdir(OPTS.framesMobile, { recursive: true });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 20 * 1024 * 1024) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Equaliza o white-point de um PNG vindo do canvas do browser e salva como WebP.
 * Mesmo algoritmo do script Python: highlight lift + edge fade + bg clamp [255,255,255].
 */
async function equalizeAndSave(
  pngBuf,
  outPath,
  { quality, edgePadPx = 60, whiteThreshold = 225, maxWidth = null } = {}
) {
  const meta = await sharp(pngBuf).metadata();
  const w = meta.width || 1280;
  const h = meta.height || 720;

  const { data, info } = await sharp(pngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const arr = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const channels = info.channels;
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

      const dx = Math.min(x, w - 1 - x) / edgePadPx;
      const dy = Math.min(y, h - 1 - y) / edgePadPx;
      const edgeFade = clamp(Math.min(dx, dy), 0, 1);

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

  let s = sharp(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), {
    raw: { width: w, height: h, channels },
  });
  if (maxWidth && w > maxWidth) {
    s = s.resize({ width: maxWidth, withoutEnlargement: true });
  }
  await s.webp({ quality, effort: 4 }).toFile(outPath);
}

function serveStatic(req, res) {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/_extract.html";
  if (reqPath.startsWith("/..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  const filePath = path.resolve(PUBLIC_DIR, "." + reqPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end("Not Found: " + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": st.size,
      "Access-Control-Allow-Origin": "*",
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const savedState = {
  desktopCount: 0,
  mobileCount: 0,
  startedAt: Date.now(),
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/save-frame") {
      const raw = await readBody(req);
      const body = JSON.parse(raw.toString("utf8"));
      const idx = Number(body.index);
      const kind = body.kind || "desktop";
      if (!Number.isFinite(idx) || idx < 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "bad index" }));
        return;
      }
      const base64 = String(body.dataUrl || "").replace(
        /^data:image\/(webp|png);base64,/,
        ""
      );
      const isPng = String(body.dataUrl || "").startsWith("data:image/png");
      const buf = Buffer.from(base64, "base64");
      const fileName = `frame_${String(idx).padStart(3, "0")}.webp`;

      if (kind === "mobile" && OPTS.framesMobile) {
        const out = path.join(OPTS.framesMobile, fileName);
        await equalizeAndSave(buf, out, {
          quality: OPTS.mobileQuality,
          edgePadPx: 50,
          maxWidth: OPTS.mobileMaxWidth,
        });
        savedState.mobileCount++;
      } else {
        const out = path.join(OPTS.framesOut, fileName);
        await equalizeAndSave(buf, out, {
          quality: OPTS.quality,
          edgePadPx: 60,
        });
        savedState.desktopCount++;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, saved: savedState }));
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/status")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ...savedState,
          total: OPTS.totalFrames,
          elapsedMs: Date.now() - savedState.startedAt,
        })
      );
      return;
    }

    return serveStatic(req, res);
  } catch (e) {
    console.error("[SERVER ERR]", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
});

server.listen(OPTS.port, () => {
  console.log(
    `[OK] Extração rodando em http://localhost:${OPTS.port}\n` +
      `       Desktop -> ${OPTS.framesOut}\n` +
      `       Mobile  -> ${OPTS.framesMobile || "(desativado)"}\n` +
      `       Abra http://localhost:${OPTS.port}/_extract.html no browser e clique em "Iniciar".`
  );
});
