import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = 4177;

const server = http.createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0];
  const fileName = urlPath === '/' ? 'search.v1.html' : path.basename(urlPath);
  const fullPath = path.join(DIST_DIR, fileName);

  if (!fullPath.startsWith(DIST_DIR) || !fileName.endsWith('.html')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  try {
    const html = await fs.readFile(fullPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[mcp-ui serve-dist] listening on http://127.0.0.1:${PORT}`);
});

