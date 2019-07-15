const http = require('http');
const fs = require('fs');
const path = require('path');
const { rootPath } = require('./definitions');

function serve(staticPath, port = 4201) {
  http.createServer((request, response) => {
    const filePath = path.resolve(rootPath, staticPath);
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.svg': 'application/image/svg+xml',
      '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(500);
        response.end('Something went wrong: ' + error.code + ' ..\n');
      } else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });
  }).listen(port);
  console.log(`Server running at http://localhost:${port}/, serving ${staticPath}`);
}

module.exports = { serve };
