// 零依赖静态文件服务器：服务于 oasis-game-draft 目录，用于本地冒烟测试
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = 'C:/Users/EasonG/Desktop/文件/大二下学期开发/oasis/oasis-game-draft';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.normalize(path.join(root, urlPath === '/' ? 'index.html' : urlPath));
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
    fs.readFile(filePath, (err2, data) => {
      if (err2) { res.writeHead(500); res.end('Read Error'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});
server.listen(8123, '127.0.0.1', () => console.log('oasis server on http://127.0.0.1:8123'));