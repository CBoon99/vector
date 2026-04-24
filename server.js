const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const HAS_DIST = fs.existsSync(path.join(DIST, 'index.html'));

/** Prefer built output: root index.html has no bundle; only dist/ has Webpack-injected scripts. */
const WEB_ROOT = HAS_DIST ? DIST : ROOT;

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm',
    '.map': 'application/json'
};

function resolveFile(urlPath) {
    const clean = (urlPath || '/').split('?')[0];
    if (clean === '/' || clean === '') {
        return path.join(WEB_ROOT, 'index.html');
    }
    const rel = clean.startsWith('/') ? clean.slice(1) : clean;
    const candidate = path.join(WEB_ROOT, rel);
    if (!candidate.startsWith(WEB_ROOT)) {
        return null;
    }
    return candidate;
}

const server = http.createServer((req, res) => {
    const urlPath = req.url || '/';
    console.log(`${req.method} ${urlPath}`);

    if (urlPath.includes('..')) {
        res.writeHead(400);
        res.end('Invalid path');
        return;
    }

    const filePath = resolveFile(urlPath);
    if (!filePath) {
        res.writeHead(400);
        res.end('Invalid path');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
            return;
        }
        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Serving from: ${WEB_ROOT}`);
    if (!HAS_DIST) {
        console.warn(
            '\n[warn] dist/index.html not found. Run `npm run build` first, or use `npm run dev` (webpack dev server).\n'
        );
    }
    console.log('Press Ctrl+C to stop the server');
});
